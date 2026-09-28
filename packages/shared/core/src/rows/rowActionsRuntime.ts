/**
 * The table's own row actions — pin, duplicate, delete — and how they join
 * the host's.
 *
 * These sit at the boundary between the table and the host: the table knows
 * *when* the reader asked (a row action, a toolbar control) and the host knows
 * what a copy of a row IS and whether it may go. So the table asks and the
 * host does the rest — the same one-way flow every other write follows. They
 * arrive as ordinary {@link RowAction}s, so every kit already renders them in
 * the trailing actions column, hideable and confirmable like the host's own.
 *
 * Pinning is the exception that holds state: the pin lists live in a
 * controllable store, which the host may own. The table still never mutates
 * the host's lists; it asks through the store's change callback.
 */
import type {
  ControllableStore,
  ControllableStoreOptions,
} from "../state/controllableStore";
import { applyRowPin, sameRowPins } from "../state/tableStores";
import type { RowAction, TableLabels } from "../types";
import type { RowPinSide, RowPinState } from "./rowPinModel";

/**
 * Synthesized "Pin to top" action.
 *
 * @public
 */
export const PIN_TOP_ACTION_KEY = "adapttable:pin-row-top";
/**
 * Synthesized "Pin to bottom" action.
 *
 * @public
 */
export const PIN_BOTTOM_ACTION_KEY = "adapttable:pin-row-bottom";
/**
 * Synthesized "Unpin" action.
 *
 * @public
 */
export const UNPIN_ROW_ACTION_KEY = "adapttable:unpin-row";
/**
 * The key of the synthesized duplicate action.
 *
 * @public
 */
export const DUPLICATE_ROW_ACTION_KEY = "adapttable:duplicate-row";
/**
 * The key of the synthesized delete action.
 *
 * @public
 */
export const DELETE_ROW_ACTION_KEY = "adapttable:delete-row";

/**
 * Labels the pin actions and the live region need.
 *
 * @public
 */
export interface RowPinLabels {
  /** Pin the row to the top. */
  pinToTop: string;
  /** Pin the row to the bottom. */
  pinToBottom: string;
  /** Return the row to the scroll area. */
  unpinRow: string;
}

/**
 * Store options for the pin lists: a commit that leaves the lists as they are
 * changes nothing.
 *
 * @public
 */
export const ROW_PIN_STORE_OPTIONS: ControllableStoreOptions<RowPinState> = {
  equals: sameRowPins,
};

/**
 * Pin a row to an edge — moving it off the other — or unpin it with
 * `undefined`. Nothing happens while pinning is not enabled.
 *
 * @param store - The pin lists.
 * @param enabled - Whether pinning is on.
 * @param rowId - The row.
 * @param side - The edge, or `undefined` to unpin.
 *
 * @public
 */
export function commitRowPin(
  store: ControllableStore<RowPinState>,
  enabled: boolean,
  rowId: string,
  side: RowPinSide | undefined
): void {
  if (enabled) store.update((current) => applyRowPin(current, rowId, side));
}

/**
 * The three pin actions, each hidden where it would do nothing: a top-pinned
 * row does not offer Pin to top, an unpinned one does not offer Unpin.
 *
 * @typeParam TRow - The row type.
 * @param options - Labels, the current edge of a row, and the pin writes.
 * @returns Pin to top, Pin to bottom and Unpin, in that order.
 *
 * @public
 */
export function rowPinActions<TRow>(options: {
  readonly labels: RowPinLabels;
  readonly getRowId: (row: TRow) => string;
  readonly sideOf: (rowId: string) => RowPinSide | undefined;
  readonly pin: (rowId: string, side: RowPinSide) => void;
  readonly unpin: (rowId: string) => void;
}): RowAction<TRow>[] {
  const { labels, getRowId, sideOf, pin, unpin } = options;
  return [
    {
      key: PIN_TOP_ACTION_KEY,
      label: labels.pinToTop,
      isHidden: (row) => sideOf(getRowId(row)) === "top",
      onClick: (row) => {
        pin(getRowId(row), "top");
      },
    },
    {
      key: PIN_BOTTOM_ACTION_KEY,
      label: labels.pinToBottom,
      isHidden: (row) => sideOf(getRowId(row)) === "bottom",
      onClick: (row) => {
        pin(getRowId(row), "bottom");
      },
    },
    {
      key: UNPIN_ROW_ACTION_KEY,
      label: labels.unpinRow,
      isHidden: (row) => sideOf(getRowId(row)) === undefined,
      onClick: (row) => {
        unpin(getRowId(row));
      },
    },
  ];
}

/**
 * Whether the host asked for row pinning: the feature armed it, or it passed
 * either half of the controlled pair.
 *
 * @param props - The composed props.
 * @returns Whether pinning was requested.
 *
 * @public
 */
export function rowPinningRequested(props: {
  readonly rowPinningArmed?: boolean;
  readonly pinnedRowIds?: RowPinState;
  readonly onPinnedRowIdsChange?: (next: RowPinState) => void;
}): boolean {
  return (
    props.rowPinningArmed === true ||
    props.pinnedRowIds !== undefined ||
    props.onPinnedRowIdsChange !== undefined
  );
}

/**
 * The development warning for pinning asked for while grouping or a tree is
 * armed — a nested list is not a flat pin stack — or `undefined`.
 *
 * @param requested - Whether pinning was requested.
 * @param blocked - Whether grouping or a tree is armed.
 * @returns The message to warn with, if any.
 *
 * @public
 */
export function rowPinningBlockedWarning(
  requested: boolean,
  blocked: boolean
): string | undefined {
  return requested && blocked
    ? "row pinning is ignored while grouping or a tree is armed — pin a flat list, not a nested one."
    : undefined;
}

/**
 * Where the pin lists come from and where changes go.
 *
 * The host's `pinnedRowIds` wins; without it the lists live in the URL
 * (`rowPin`), unless URL sync is off. Every change reaches the URL when the
 * URL holds the lists, and the host's callback always.
 *
 * @param options - The request, the host's pair and the URL's pair.
 * @returns The lists and the change callback, both absent when not requested.
 *
 * @public
 */
export function rowPinningControl(options: {
  readonly requested: boolean;
  readonly pinnedRowIds?: RowPinState;
  readonly onPinnedRowIdsChange?: (next: RowPinState) => void;
  readonly urlPinnedRowIds?: RowPinState;
  readonly writeUrl: (next: RowPinState) => void;
}): {
  readonly pinnedRowIds: RowPinState | undefined;
  readonly onPinnedRowIdsChange: ((next: RowPinState) => void) | undefined;
} {
  const { requested, pinnedRowIds, onPinnedRowIdsChange, writeUrl } = options;
  if (!requested) {
    return { pinnedRowIds: undefined, onPinnedRowIdsChange: undefined };
  }
  return {
    pinnedRowIds: pinnedRowIds ?? options.urlPinnedRowIds,
    onPinnedRowIdsChange: (next) => {
      if (pinnedRowIds === undefined) writeUrl(next);
      onPinnedRowIdsChange?.(next);
    },
  };
}

/**
 * Whether the URL holds the pin lists: sync is not off, pinning was
 * requested, and the host does not hold them.
 *
 * @param options - The sync prop, the request and the host's lists.
 * @returns Whether to read and write `rowPin`.
 *
 * @public
 */
export function rowPinningUrlSync(options: {
  readonly urlSync?: boolean;
  readonly requested: boolean;
  readonly pinnedRowIds?: RowPinState;
}): boolean {
  return (
    options.urlSync !== false &&
    options.requested &&
    options.pinnedRowIds === undefined
  );
}

/**
 * Duplicate and Delete, in that order, for whichever handler the host wired.
 * A delete asks first unless `confirmDelete` is false: it is destructive and
 * the table cannot undo it.
 *
 * @typeParam TRow - The row type.
 * @param options - The asks, the confirmation rule and the labels.
 * @returns The actions; empty when the host wired neither.
 *
 * @public
 */
export function rowMutationActions<TRow>(options: {
  readonly duplicate?: (row: TRow) => void;
  readonly remove?: (row: TRow) => void;
  readonly confirmDelete: boolean;
  readonly labels: Pick<
    Required<TableLabels>,
    "duplicateRow" | "deleteRow" | "deleteRowConfirm"
  >;
}): RowAction<TRow>[] {
  const { duplicate, remove, confirmDelete, labels } = options;
  const built: RowAction<TRow>[] = [];
  if (duplicate) {
    built.push({
      key: DUPLICATE_ROW_ACTION_KEY,
      label: labels.duplicateRow,
      onClick: duplicate,
    });
  }
  if (remove) {
    built.push({
      key: DELETE_ROW_ACTION_KEY,
      label: labels.deleteRow,
      // The kits' destructive token — the same one a host's own delete uses.
      color: "red",
      onClick: remove,
      confirm: confirmDelete
        ? {
            title: labels.deleteRow,
            message: () => labels.deleteRowConfirm,
            confirmLabel: labels.deleteRow,
            danger: true,
          }
        : undefined,
    });
  }
  return built;
}

/**
 * The trailing actions column's list and whether the column exists at all.
 *
 * @public
 */
export interface MergedRowActions<TRow> {
  /** What the column renders; absent when it is hidden or has nothing. */
  readonly rowActions: RowAction<TRow>[] | undefined;
  /** Whether the table has row actions at all, hidden column or not. */
  readonly hasRowActions: boolean;
}

/**
 * The host's row actions with Duplicate and Delete appended, so a delete stays
 * last. The host's own list is handed back untouched when nothing is added.
 *
 * @typeParam TRow - The row type.
 * @param options - The host's list, the mutation actions, and whether the
 *   actions column is hidden.
 * @returns The merged list and whether there is one.
 *
 * @public
 */
export function withRowMutationActions<TRow>(options: {
  readonly host?: RowAction<TRow>[];
  readonly mutations: readonly RowAction<TRow>[];
  readonly actionsHidden: boolean;
}): MergedRowActions<TRow> {
  const { host, mutations, actionsHidden } = options;
  const hasRowActions = (host?.length ?? 0) + mutations.length > 0;
  if (actionsHidden || !hasRowActions) {
    return { rowActions: undefined, hasRowActions };
  }
  return {
    rowActions: mutations.length === 0 ? host : [...(host ?? []), ...mutations],
    hasRowActions,
  };
}

/**
 * The row actions with the pin entries appended. They ride the same trailing
 * column as the host's actions rather than a column of their own, and a table
 * with pinning on has an actions column even when the host listed nothing.
 *
 * @typeParam TRow - The row type.
 * @param options - The actions so far, whether pinning is on, its actions,
 *   and whether the actions column is hidden.
 * @returns The merged list and whether there is one.
 *
 * @public
 */
export function withRowPinActions<TRow>(options: {
  readonly rowActions?: RowAction<TRow>[];
  readonly hasRowActions: boolean;
  readonly pinning: boolean;
  readonly pins: readonly RowAction<TRow>[];
  readonly actionsHidden: boolean;
}): MergedRowActions<TRow> {
  const { rowActions, pins } = options;
  const hasRowActions = options.hasRowActions || options.pinning;
  const withPins =
    pins.length === 0 ? rowActions : [...(rowActions ?? []), ...pins];
  return {
    rowActions: options.actionsHidden || !hasRowActions ? undefined : withPins,
    hasRowActions,
  };
}
