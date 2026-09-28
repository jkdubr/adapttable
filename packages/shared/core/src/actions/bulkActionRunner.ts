/**
 * Running bulk actions, and the "select all matching" banner beside them.
 *
 * The runner tracks the action in flight, routes through the confirmation
 * handler, catches rejections (exposed as `error`, never an unhandled
 * rejection), and reports the outcome of every run. The banner decides
 * which of its two states shows and what a bulk action acts on. Every
 * binding's bulk bar renders from these, so the rules cannot drift by kit.
 */
import type { HeaderSelectionState } from "../selection/selectionState";
import { offersAllMatching } from "../state/tableStores";
import type { BulkAction, BulkActionContext, TableLabels } from "../types";
import type { ConfirmHandler } from "./confirm";

/**
 * A bulk-action rejection as display text, or `null` when there is none.
 *
 * @param error - What the run rejected with.
 * @returns The message.
 *
 * @public
 */
export function bulkActionErrorMessage(error: unknown): string | null {
  if (error == null) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    typeof error === "bigint"
  ) {
    return String(error);
  }
  try {
    return JSON.stringify(error) ?? "Unknown error";
  } catch {
    return "Unknown error";
  }
}

/**
 * How a bulk-action run ended — passed to `onComplete` on every run.
 *
 * @public
 */
export type BulkActionOutcome =
  { status: "success" } | { status: "error"; error: unknown };

/**
 * What a bulk-action runner is configured with.
 *
 * @public
 */
export interface BulkActionRunnerOptions {
  /** Confirmation handler for actions that declare a `confirm` block. */
  confirm: ConfirmHandler;
  /** Cancel label for confirm dialogs. */
  cancelLabel: string;
  /** Called after every run with its outcome — success or failure. */
  onComplete?: (outcome: BulkActionOutcome) => void;
}

/**
 * A bulk-action runner's state at one moment.
 *
 * @public
 */
export interface BulkActionRunnerSnapshot {
  /** Key of the action currently running, or `null`. */
  readonly pending: string | null;
  /** The value the last run rejected with, or `null`. */
  readonly error: unknown;
}

/**
 * The bulk-action runner.
 *
 * @public
 */
export interface BulkActionRunnerController {
  /** The current state. A new object whenever anything in it changes. */
  readonly getSnapshot: () => BulkActionRunnerSnapshot;
  /** Listen for state changes. Returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Replace the configuration — a binding calls this on every render. */
  readonly configure: (options: BulkActionRunnerOptions) => void;
  /**
   * Run a bulk action against the given ids, confirming first if it asks.
   * Omit `context` for the plain page-selection scope. Nothing runs for an
   * empty list.
   */
  readonly run: (
    action: BulkAction,
    ids: string[],
    context?: BulkActionContext
  ) => void;
}

/**
 * Create a bulk-action runner.
 *
 * @param initial - The first configuration.
 * @returns The runner.
 *
 * @public
 */
export function createBulkActionRunner(
  initial: BulkActionRunnerOptions
): BulkActionRunnerController {
  let options = initial;
  let snapshot: BulkActionRunnerSnapshot = { pending: null, error: null };
  const listeners = new Set<() => void>();

  const write = (patch: Partial<BulkActionRunnerSnapshot>): void => {
    const next = { ...snapshot, ...patch };
    if (next.pending === snapshot.pending && next.error === snapshot.error) {
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
    configure(next) {
      options = next;
    },
    run(action, ids, context) {
      if (ids.length === 0) return;
      const scope: BulkActionContext = context ?? {
        allMatching: false,
        total: ids.length,
      };
      const { confirm, cancelLabel, onComplete } = options;
      const fire = async (): Promise<void> => {
        try {
          write({ pending: action.key, error: null });
          await action.onClick(ids, scope);
          onComplete?.({ status: "success" });
        } catch (error) {
          write({ error });
          onComplete?.({ status: "error", error });
        } finally {
          write({ pending: null });
        }
      };
      if (!action.confirm) {
        void fire();
        return;
      }
      confirm({
        title: action.confirm.title,
        // The confirm count reflects the SCOPE: the whole matching set when
        // "select all matching" is active, the page ids otherwise.
        message: action.confirm.message(scope.total),
        confirmLabel: action.confirm.confirmLabel,
        cancelLabel,
        danger: action.confirm.danger,
        onConfirm: () => void fire(),
      });
    },
  };
}

/**
 * The selection a bulk bar reads.
 *
 * @public
 */
export interface BulkBarSelection {
  /** Whether "select all matching" is active. */
  readonly allMatching: boolean;
  /** Whether the source can answer for rows past the page. */
  readonly acrossPages: boolean;
  /** The header control's tri-state over the visible rows. */
  readonly headerState: HeaderSelectionState;
  /** The visible ids, in row order. */
  readonly visibleIds: readonly string[];
}

/**
 * The bulk bar's "select all matching" banner and the scope its actions run
 * over.
 *
 * @public
 */
export interface BulkBarModel {
  /** Whether the "select all N matching" banner should show. */
  readonly expandable: boolean;
  /** The whole matching set when "all matching" is on, else `undefined`. */
  readonly scope: BulkActionContext | undefined;
  /** The banner's text and action label for the current state. */
  readonly banner: {
    readonly text: string;
    readonly action: string;
    /** Which way the banner's action goes. */
    readonly command: "clear" | "select-all-matching";
  };
}

/**
 * Derive the bulk bar's banner and scope.
 *
 * A full page is selected, more rows match elsewhere, and the source can
 * speak for them → the two-state "select all N matching" banner rather than
 * the plain count. When "all matching" is active, bulk actions act on the
 * WHOLE filtered set: the scope tells the handler (and the confirm count) so.
 *
 * @param selection - The selection.
 * @param total - Rows in the whole filtered set.
 * @param labels - Resolved labels.
 * @returns The banner and the scope.
 *
 * @public
 */
export function bulkBarModel(
  selection: BulkBarSelection,
  total: number,
  labels: Pick<
    Required<TableLabels>,
    "allMatchingSelected" | "clearAll" | "pageSelected" | "selectAllMatching"
  >
): BulkBarModel {
  const expandable = offersAllMatching(selection, total);
  if (selection.allMatching) {
    return {
      expandable,
      scope: { allMatching: true, total },
      banner: {
        text: labels.allMatchingSelected(total),
        action: labels.clearAll,
        command: "clear",
      },
    };
  }
  return {
    expandable,
    scope: undefined,
    banner: {
      text: labels.pageSelected(selection.visibleIds.length),
      action: labels.selectAllMatching(total),
      command: "select-all-matching",
    },
  };
}
