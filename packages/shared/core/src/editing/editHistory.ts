/**
 * Undo and redo, without the table ever owning the data.
 *
 * The boundary is the whole design: AdaptTable never mutates rows, so it
 * cannot "restore" anything. What it can do is remember the value a cell held
 * before an edit and, on undo, COMMIT that value back through `onCellEdit` —
 * the same call the original edit made. Everything the host wrapped around
 * editing (validation, a mutation, an optimistic update, a toast) runs on the
 * way back exactly as it ran on the way out.
 *
 * A gesture is one entry, not one cell. Pasting two hundred cells and pressing
 * undo once puts all two hundred back, because that is what a person means by
 * "undo that paste" — and it is why the batch routes record themselves rather
 * than each cell recording itself.
 */
import type { CellEdit } from "../focus/cellEdits";
import {
  createEditHistoryStack,
  DEFAULT_EDIT_HISTORY_DEPTH,
  editHistoryEntry,
  type EditHistorySnapshot,
  readCellValue,
} from "./editingController";

/**
 * The host's commit channel — what an undo replays through.
 *
 * @public
 */
export type CellEditHandler<TRow> = (
  row: TRow,
  key: string,
  nextValue: unknown
) => unknown;

/**
 * What an edit history needs: whether it runs, how deep it goes, how a cell's
 * value is read before it changes, and where a replay goes.
 *
 * @public
 */
export interface EditHistoryControllerOptions<TRow> {
  /** Off unless the host asked for it; when false nothing is recorded. */
  readonly enabled: boolean;
  /** How many gestures to remember. Defaults to 50. */
  readonly depth?: number;
  /** The columns, for reading a cell's value before it changes. */
  readonly columns: readonly {
    readonly key: string;
    readonly editValue?: (row: TRow) => unknown;
    readonly sortValue?: (row: TRow) => unknown;
  }[];
  /** The host's commit channel — every replay goes back out through it. */
  readonly onCellEdit?: CellEditHandler<TRow>;
}

/**
 * What an edit history offers — the state a binding hands its chrome.
 *
 * @public
 */
export interface EditHistoryState<TRow> {
  /**
   * Whether the host armed a history at all.
   *
   * `canUndo` answers "is there something to put back", which is false
   * both when the feature is off and when nothing has been edited yet.
   * Chrome that should not exist without a history needs the other
   * question, and this is it.
   */
  enabled: boolean;
  /** Whether anything can be undone right now. */
  canUndo: boolean;
  /** Whether anything can be redone right now. */
  canRedo: boolean;
  /**
   * Put the last gesture back, through the host's own commit channel.
   *
   * @returns How many cells were restored; zero when there was nothing to undo.
   */
  undo: () => number;
  /**
   * Do the last undone gesture again.
   *
   * @returns How many cells were rewritten; zero when there was nothing to redo.
   */
  redo: () => number;
  /** Forget everything — what a host calls when the data is replaced. */
  clear: () => void;
  /**
   * Record a batch as ONE gesture. Records nothing when history is off, in
   * which case the caller's own handler still runs.
   */
  record: (edits: readonly CellEdit<TRow>[]) => void;
}

/**
 * The edit history: the stack, plus the rules for what a gesture records and
 * where its replay goes.
 *
 * @public
 */
export interface EditHistoryController<TRow> {
  /** The stack's counts now. */
  readonly getSnapshot: () => EditHistorySnapshot;
  /** Listen for changes. Returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Replace the options. */
  readonly configure: (options: EditHistoryControllerOptions<TRow>) => void;
  /** Record a gesture, reading each cell's value before it changes. */
  readonly record: (edits: readonly CellEdit<TRow>[]) => void;
  /** Replay the last gesture backwards. */
  readonly undo: () => number;
  /** Replay the last undone gesture forwards. */
  readonly redo: () => number;
  /** Forget everything. */
  readonly clear: () => void;
}

/**
 * Create an edit history.
 *
 * @typeParam TRow - The row type.
 * @param options - See {@link EditHistoryControllerOptions}.
 * @returns The controller; records nothing while `enabled` is false.
 *
 * @public
 */
export function createEditHistory<TRow>(
  options: EditHistoryControllerOptions<TRow>
): EditHistoryController<TRow> {
  let current = options;
  const stack = createEditHistoryStack<TRow>();

  // An undo does not rewrite the host's data: it COMMITS the previous value
  // back through the host's own channel, so whatever wraps editing runs on
  // the way back exactly as it ran on the way out.
  const replay = (edits: readonly CellEdit<TRow>[]): number => {
    for (const edit of edits) {
      current.onCellEdit?.(edit.row, edit.columnKey, edit.value);
    }
    return edits.length;
  };

  return {
    getSnapshot: stack.getSnapshot,
    subscribe: stack.subscribe,
    configure(next) {
      current = next;
    },
    record(edits) {
      if (!current.enabled || edits.length === 0) return;
      stack.record(
        editHistoryEntry(edits, (edit) => {
          const column = current.columns.find(
            (entry) => entry.key === edit.columnKey
          );
          return column
            ? { value: readCellValue(edit.row, column) }
            : undefined;
        }),
        current.depth ?? DEFAULT_EDIT_HISTORY_DEPTH
      );
    },
    undo() {
      const entry = stack.undo();
      return entry ? replay(entry.undo) : 0;
    },
    redo() {
      const entry = stack.redo();
      return entry ? replay(entry.redo) : 0;
    },
    clear: stack.clear,
  };
}

/**
 * The state a binding hands its chrome, read off one snapshot.
 *
 * @param history - The controller the actions go to.
 * @param snapshot - The stack's counts.
 * @param enabled - Whether the host armed a history.
 * @returns The history state.
 *
 * @public
 */
export function editHistoryView<TRow>(
  history: EditHistoryController<TRow>,
  snapshot: EditHistorySnapshot,
  enabled: boolean
): EditHistoryState<TRow> {
  return {
    enabled,
    canUndo: enabled && snapshot.past > 0,
    canRedo: enabled && snapshot.future > 0,
    undo: history.undo,
    redo: history.redo,
    clear: history.clear,
    record: history.record,
  };
}

/**
 * The `editHistory` prop, resolved: whether a history runs, and how deep.
 *
 * @param editHistory - The prop as the host wrote it.
 * @returns Whether it is armed, and its depth when the host set one.
 *
 * @public
 */
export function resolveEditHistory(
  editHistory: boolean | { readonly depth?: number } | undefined
): { readonly enabled: boolean; readonly depth: number | undefined } {
  return {
    enabled: editHistory !== undefined && editHistory !== false,
    depth: typeof editHistory === "object" ? editHistory.depth : undefined,
  };
}

/**
 * The commit channel to hand the chrome: each inline commit is recorded as a
 * one-cell gesture before it is passed on.
 *
 * Batch routes (paste, fill) must NOT go through it — they record themselves
 * through `asGesture`, so that two hundred pasted cells undo in one press
 * rather than two hundred.
 *
 * @param onCellEdit - The host's channel, or `undefined` when cells do not edit.
 * @param record - The history's `record`.
 * @returns The recording channel, or `undefined` when there is no channel.
 *
 * @public
 */
export function recordingCellEdit<TRow>(
  onCellEdit: CellEditHandler<TRow> | undefined,
  record: (edits: readonly CellEdit<TRow>[]) => void
): CellEditHandler<TRow> | undefined {
  if (!onCellEdit) return undefined;
  return (row, key, nextValue) => {
    record([{ row, columnKey: key, value: nextValue }]);
    // Hand back whatever the host returned: a promise is how a cell knows the
    // value is still on its way somewhere, and swallowing it here would make
    // every save look instant.
    return onCellEdit(row, key, nextValue);
  };
}
