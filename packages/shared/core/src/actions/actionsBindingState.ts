/**
 * Shared state shapes a framework binding returns from its hooks. Each
 * binding adapts core's stores to its reactivity and hands back these
 * shapes, so a kit reads the same fields in every framework.
 */
import type { BulkAction, BulkActionContext } from "../types";

/**
 * The derived bulk-bar state every adapter renders from.
 *
 * @public
 */
export interface BulkBarState {
  /** Number of rows currently selected. */
  selectedCount: number;
  /** Selected ids as a fresh array (safe to pass to `run`). */
  ids: string[];
  /** Key of the action currently running, or `null`. */
  pending: string | null;
  /**
   * Message of the last failed run, or `null`. The selection is KEPT on
   * failure (so the user can retry); adapters render this in the bar,
   * ideally in a live region.
   */
  errorMessage: string | null;
  /** Run a bulk action against `ids` (and `scope` when "all matching" is on). */
  run: (action: BulkAction, ids: string[], context?: BulkActionContext) => void;
  /** Clear the selection. */
  clear: () => void;
  /** Whether the "select all N matching" banner should show. */
  expandable: boolean;
  /** Bulk-action scope: the whole matching set when active, else `undefined`. */
  scope: BulkActionContext | undefined;
  /** The banner's text, action label, and click handler for the current state. */
  banner: { text: string; action: string; onClick: () => void };
}
