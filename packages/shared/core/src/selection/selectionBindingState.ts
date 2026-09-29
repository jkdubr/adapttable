/**
 * Shared state shapes a framework binding returns from its hooks. Each
 * binding adapts core's stores to its reactivity and hands back these
 * shapes, so a kit reads the same fields in every framework.
 */
import type { HeaderSelectionState } from "./selectionState";

/**
 * Selection state + actions returned by `useSelection`.
 *
 * @public
 */
export interface SelectionState {
  /** The set of selected ids. */
  selectedIds: ReadonlySet<string>;
  /** Number of selected ids. */
  selectedCount: number;
  /** Tri-state for the visible rows (`all` / `some` / `none`). */
  headerState: HeaderSelectionState;
  /** Whether a specific id is selected. */
  isSelected: (id: string) => boolean;
  /** Toggle a single id. */
  toggle: (id: string) => void;
  /**
   * Toggle all leaf ids in a group (select missing, or deselect when all
   * selected) — one commit so memoized rows see a single selection change.
   */
  toggleGroupLeaves: (leafIds: readonly string[]) => void;
  /** Toggle every visible id (select all, or clear all if already full). */
  toggleAll: () => void;
  /** Clear the entire selection. */
  clear: () => void;
  /** Replace the selection with the given ids, or clear it when omitted. */
  replace: (ids: readonly string[] | undefined) => void;
  /** The visible ids, in row order. */
  visibleIds: string[];
  /** True when the user chose "select all matching" across every page. */
  allMatching: boolean;
  /** Extend the selection to every matching row (across all pages). */
  selectAllMatching: () => void;
  /** Whether the source can answer for rows beyond the ones on screen. */
  acrossPages: boolean;
}
