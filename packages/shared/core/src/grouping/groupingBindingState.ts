/**
 * Shared state shapes a framework binding returns from its hooks. Each
 * binding adapts core's stores to its reactivity and hands back these
 * shapes, so a kit reads the same fields in every framework.
 */
import type { GroupPaging } from "./groupRows";

/**
 * Collapse state + actions returned by `useGroupCollapse`.
 *
 * @public
 */
export interface GroupCollapseState {
  /** Ids of currently collapsed groups (`group:…` keys). */
  collapsedGroupIds: ReadonlySet<string>;
  /** Whether a group is collapsed. */
  isCollapsed: (groupKey: string) => boolean;
  /** Toggle a group's collapsed state. */
  toggle: (groupKey: string) => void;
  /** Expand every group (clear the collapsed set). */
  expandAll: () => void;
  /** Collapse every group in `groupKeys`. */
  collapseAll: (groupKeys: readonly string[]) => void;
  /**
   * Show the tree down to `depth` and no further: every group at that depth or
   * deeper closes, everything above it opens. Depth 0 collapses the top level,
   * so only the outermost headers show.
   */
  collapseToDepth: (
    depth: number,
    groups: readonly { key: string; level: number }[]
  ) => void;
}

/**
 * Paging state and the one action that changes it.
 *
 * @public
 */
export interface GroupPagingState {
  /** What the model reads. */
  paging: GroupPaging;
  /**
   * Reveal one more page. `groupKey` names the group whose leaves to extend;
   * omit it for the top-level groups.
   */
  showMore: (pageSize: number, groupKey?: string) => void;
  /** Back to the first page of everything — what new data calls for. */
  reset: () => void;
}
