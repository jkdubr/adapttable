/**
 * Which row groups are closed, as actions over a controllable id set.
 *
 * Groups default to expanded, so the collapsed set is the small one. The set
 * is ephemeral table state: the table holds it, or the host does through a
 * controlled pair — the store decides which, and these actions only say what
 * each gesture changes.
 */
import type { ControllableStore } from "../state/controllableStore";
import { groupsCollapsedToDepth, toggleId } from "../state/tableStores";

/**
 * What a reader can do to the collapsed groups.
 *
 * @public
 */
export interface GroupCollapseActions {
  /** Open or close one group. */
  readonly toggle: (groupKey: string) => void;
  /** Open every group. */
  readonly expandAll: () => void;
  /** Close every group in `groupKeys`. */
  readonly collapseAll: (groupKeys: readonly string[]) => void;
  /**
   * Show the tree down to `depth` and no further: every group at that depth
   * or deeper closes, everything above it opens. Depth 0 collapses the top
   * level, so only the outermost headers show.
   */
  readonly collapseToDepth: (
    depth: number,
    groups: readonly { key: string; level: number }[]
  ) => void;
}

/**
 * Build the collapse actions over one store. They are as stable as the store,
 * so a binding can hand them out without rebuilding the grouped model.
 *
 * @param store - The collapsed-group ids.
 * @returns The actions.
 *
 * @public
 */
export function groupCollapseActions(
  store: ControllableStore<ReadonlySet<string>>
): GroupCollapseActions {
  return {
    toggle: (groupKey) => {
      store.update((prev) => toggleId(prev, groupKey));
    },
    expandAll: () => {
      store.commit(new Set());
    },
    collapseAll: (groupKeys) => {
      store.commit(new Set(groupKeys));
    },
    collapseToDepth: (depth, groups) => {
      store.commit(groupsCollapsedToDepth(groups, depth));
    },
  };
}
