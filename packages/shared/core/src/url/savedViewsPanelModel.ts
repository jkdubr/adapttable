/**
 * The saved-views panel's rows: which controls each view offers, in which
 * order, which of them this reader may use, the glyph each one draws, and the
 * inline rename a row is in the middle of.
 *
 * The binding draws the panel and a kit draws every control; what each row
 * offers is decided here once, so a kit cannot render four of the five
 * controls, order them differently, or miss the disabled state on the one a
 * reader may not use.
 */
import type { TableLabels } from "../types";
import type { SavedView } from "./savedViewsController";

/**
 * Which control a cluster entry is. Stable across kits, and across renders.
 *
 * @public
 */
export type SavedViewControlKey =
  "rename" | "moveUp" | "moveDown" | "default" | "remove";

/**
 * A glyph drawn inside a saved-view control: SVG path data on a 24×24 view
 * box, stroked, and filled when `filled` is set.
 *
 * @public
 */
export interface SavedViewGlyph {
  /** The paths, in drawing order. */
  readonly paths: readonly string[];
  /** Whether the shape is filled with the current colour. */
  readonly filled: boolean;
}

/**
 * The path data for each control's glyph. Drawn by the binding rather than
 * per kit: five icons redrawn by every kit are five icons that drift.
 *
 * @public
 */
export const SAVED_VIEW_GLYPH_PATHS: Readonly<
  Record<SavedViewControlKey, readonly string[]>
> = {
  rename: ["M4 20h4l10-10-4-4L4 16v4z", "M14 6l4 4"],
  moveUp: ["M12 19V5", "M6 11l6-6 6 6"],
  moveDown: ["M12 5v14", "M6 13l6 6 6-6"],
  default: [
    "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5z",
  ],
  remove: [
    "M4 7h16",
    "M9 7V4h6v3",
    "M6 7l1 13h10l1-13",
    "M10 11v6",
    "M14 11v6",
  ],
};

/**
 * One control in a row's cluster, before a binding draws its glyph.
 *
 * @public
 */
export interface SavedViewRowControlModel {
  /** Which control this is. */
  readonly key: SavedViewControlKey;
  /** The accessible name, already localized. These controls are icon-only. */
  readonly label: string;
  /** The glyph to draw inside the kit's own icon button. */
  readonly glyph: SavedViewGlyph;
  /**
   * Run it, or `undefined` when this reader may not — a view someone else
   * owns, or a move off the end of the list. Render the control disabled
   * rather than dropping it, so rows do not jump as the list is reordered.
   */
  readonly onPress?: () => void;
  /** Whether the toggle is currently on. Only the default control sets it. */
  readonly pressed?: boolean;
  /** Destructive, so the kit can reach for its own danger colour. */
  readonly danger?: boolean;
}

/**
 * What {@link savedViewRowControls} needs for one row.
 *
 * @public
 */
export interface SavedViewRowControlsInput {
  /** The view. */
  readonly view: SavedView;
  /** Its place in the list. */
  readonly index: number;
  /** How many views the list holds. */
  readonly count: number;
  /** Whether this row is being renamed. */
  readonly editing: boolean;
  /** Resolved labels. */
  readonly labels: Pick<
    Required<TableLabels>,
    | "renameView"
    | "moveViewUp"
    | "moveViewDown"
    | "setDefaultView"
    | "deleteView"
  >;
  /** Start renaming this view. */
  readonly onStartRename: () => void;
  /** Move this view a step. */
  readonly onMove: (delta: -1 | 1) => void;
  /** Make this view the default, or clear it. */
  readonly onSetDefault: () => void;
  /** Delete this view. */
  readonly onRemove: () => void;
}

const glyphOf = (key: SavedViewControlKey, filled = false): SavedViewGlyph => ({
  paths: SAVED_VIEW_GLYPH_PATHS[key],
  filled,
});

/**
 * The cluster for one view, in the order every kit renders it: rename, up,
 * down, default, delete.
 *
 * @param input - See {@link SavedViewRowControlsInput}.
 * @returns The controls.
 *
 * @public
 */
export function savedViewRowControls(
  input: SavedViewRowControlsInput
): readonly SavedViewRowControlModel[] {
  const { view, index, count, labels } = input;
  const isDefault = view.isDefault === true;
  /** A handler, or `undefined` when this reader may not make that change. */
  const allowed = (run: () => void) =>
    view.readOnly === true ? undefined : run;
  return [
    {
      key: "rename",
      label: labels.renameView,
      glyph: glyphOf("rename"),
      onPress: input.editing ? undefined : allowed(input.onStartRename),
    },
    {
      key: "moveUp",
      label: labels.moveViewUp,
      glyph: glyphOf("moveUp"),
      onPress:
        index > 0
          ? allowed(() => {
              input.onMove(-1);
            })
          : undefined,
    },
    {
      key: "moveDown",
      label: labels.moveViewDown,
      glyph: glyphOf("moveDown"),
      onPress:
        index < count - 1
          ? allowed(() => {
              input.onMove(1);
            })
          : undefined,
    },
    {
      key: "default",
      label: labels.setDefaultView,
      glyph: glyphOf("default", isDefault),
      pressed: isDefault,
      onPress: allowed(input.onSetDefault),
    },
    {
      key: "remove",
      label: labels.deleteView,
      glyph: glyphOf("remove"),
      danger: true,
      onPress: allowed(input.onRemove),
    },
  ];
}

/**
 * The inline rename at one moment.
 *
 * @public
 */
export interface SavedViewRenameSnapshot {
  /** The view being renamed, or `null`. */
  readonly editing: string | null;
  /** The half-typed name. */
  readonly draft: string;
}

/**
 * The saved-views panel's inline rename. A half-typed name is the panel's
 * business, not the table's, so it lives here rather than with the host.
 *
 * @public
 */
export interface SavedViewRenameController {
  /** The current state. A new object whenever anything in it changes. */
  readonly getSnapshot: () => SavedViewRenameSnapshot;
  /** Listen for state changes. Returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Start renaming a view, with its name as the draft. */
  readonly begin: (name: string) => void;
  /** Change the draft. */
  readonly setDraft: (draft: string) => void;
  /** Hand the draft to `onRename` and stop editing. */
  readonly commit: (onRename: (from: string, to: string) => void) => void;
  /** Stop editing without renaming. */
  readonly cancel: () => void;
}

/**
 * Create the inline rename's controller.
 *
 * @returns The controller, not editing.
 *
 * @public
 */
export function createSavedViewRenameController(): SavedViewRenameController {
  let snapshot: SavedViewRenameSnapshot = { editing: null, draft: "" };
  const listeners = new Set<() => void>();
  const write = (next: SavedViewRenameSnapshot): void => {
    if (next.editing === snapshot.editing && next.draft === snapshot.draft) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    begin(name) {
      write({ editing: name, draft: name });
    },
    setDraft(draft) {
      write({ ...snapshot, draft });
    },
    commit(onRename) {
      if (snapshot.editing !== null) onRename(snapshot.editing, snapshot.draft);
      write({ ...snapshot, editing: null });
    },
    cancel() {
      write({ ...snapshot, editing: null });
    },
  };
}
