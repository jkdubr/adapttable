/**
 * The tree feature's runtime rules: which nodes are open, when opening one
 * fetches its children, and what a failed fetch does to it.
 *
 * Expansion is separate state from row expansion (a detail panel) and from
 * group collapse (a derived bucket), because they answer different questions
 * and a table can have all three at once. Expanded rather than collapsed,
 * unlike groups: a tree starts folded, so the open set is the small one.
 */
import type { ControllableStore } from "../state/controllableStore";
import { toggleId } from "../state/tableStores";
import type { TreeEntry } from "./treeRows";

/**
 * What a reader can do to the open tree nodes.
 *
 * @public
 */
export interface TreeExpansionActions {
  /** Open or close one node. */
  readonly toggle: (id: string) => void;
  /** Open a specific node — what "reveal this row" needs. Open stays open. */
  readonly expand: (id: string) => void;
  /** Open every node in `ids`. */
  readonly expandAll: (ids: readonly string[]) => void;
  /** Fold everything. */
  readonly collapseAll: () => void;
}

/**
 * Build the expansion actions over one store. They are as stable as the
 * store.
 *
 * @param store - The expanded node ids.
 * @returns The actions.
 *
 * @public
 */
export function treeExpansionActions(
  store: ControllableStore<ReadonlySet<string>>
): TreeExpansionActions {
  return {
    toggle: (id) => {
      store.update((prev) => toggleId(prev, id));
    },
    expand: (id) => {
      if (store.current().has(id)) return;
      store.update((prev) => new Set(prev).add(id));
    },
    expandAll: (ids) => {
      store.commit(new Set(ids));
    },
    collapseAll: () => {
      store.commit(new Set());
    },
  };
}

/**
 * Toggle a node, fetching its children first when it is being opened. The
 * node opens at once; its children fill in when they arrive.
 *
 * @param entries - The walked tree, in render order.
 * @param id - The node to toggle.
 * @param actions - The fetch and the expansion toggle.
 *
 * @public
 */
export function toggleTreeNode<TRow>(
  entries: readonly TreeEntry<TRow>[],
  id: string,
  actions: {
    readonly loadIfNeeded: (row: TRow) => void;
    readonly toggle: (id: string) => void;
  }
): void {
  const entry = entries.find((candidate) => candidate.key === id);
  if (entry && !entry.expanded) actions.loadIfNeeded(entry.row);
  actions.toggle(id);
}

/**
 * Close a node whose children failed to arrive, so the next click is a retry
 * rather than a close followed by an open.
 *
 * @param expansion - The tree's expansion state.
 * @param id - The node whose fetch failed.
 *
 * @public
 */
export function closeFailedTreeNode(
  expansion: {
    readonly isExpanded: (id: string) => boolean;
    readonly toggle: (id: string) => void;
  },
  id: string
): void {
  if (expansion.isExpanded(id)) expansion.toggle(id);
}

/**
 * Every loaded node open — what an export of the whole tree walks, including
 * the descendants of collapsed parents.
 *
 * @param entries - The walked tree as the reader sees it.
 * @returns Every node id and every descendant id.
 *
 * @public
 */
export function treeExportExpandedIds<TRow>(
  entries: readonly TreeEntry<TRow>[]
): Set<string> {
  return new Set(
    entries.flatMap((entry) => [entry.key, ...entry.descendantIds])
  );
}
