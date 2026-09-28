/**
 * The agent approval strip's contract: the feature-state keys the agent
 * feature publishes and the controls a kit fills the review with.
 *
 * Every binding's approval Chrome lays out the same approve, reject and quiet
 * controls around the same list; only the components differ. Rendered
 * content is the binding's `TNode`, so a React kit and an Angular kit fill
 * the same shapes with their own types.
 */
import { featureStateKey } from "../features/featureKeys";
import type { TableLabels } from "../types";
import type { AgentApprovalPending, AgentProgress } from "./types";

/** Feature-state key for a pending agent approval. @public */
export const AGENT_APPROVAL_STATE =
  featureStateKey<AgentApprovalPending | null>("agent-approval-pending");

/**
 * Feature-state key for how far a running capability has got.
 *
 * Published by the agent feature and read by a panel inside the table, the
 * same way a pending approval is: both happen inside a call the panel is
 * waiting on, and neither is visible from outside the table.
 *
 * @public
 */
export const AGENT_PROGRESS_STATE = featureStateKey<AgentProgress | null>(
  "agent-progress"
);

/**
 * What the reader has waved through, and how to take it back.
 *
 * Separate from the pending approval because it outlives one: the list has to
 * be visible — and revocable — when nothing is waiting, which is exactly when
 * a reader goes looking for what they agreed to.
 *
 * @public
 */
export interface AgentAlwaysAllowState {
  /** Capability keys the reader said not to ask about again. */
  readonly capabilities: readonly string[];
  /** Ask about this capability again from now on. */
  readonly revoke: (capability: string) => void;
}

/** Feature-state key for the remembered "don't ask again" set. @public */
export const AGENT_ALWAYS_ALLOW_STATE =
  featureStateKey<AgentAlwaysAllowState | null>("agent-always-allow");

/**
 * The live view and filter data the manifest does not carry.
 *
 * A reader rather than a value: it is read when a turn starts and again when
 * it settles, and a value captured a render earlier would report that nothing
 * moved — which is precisely what per-turn undo has to be able to tell.
 *
 * @public
 */
export interface AgentViewState {
  /** Read the table's live view and filter catalog, right now. */
  readonly read: () => unknown;
}

/** Feature-state key for that reader. @public */
export const AGENT_VIEW_STATE = featureStateKey<AgentViewState | null>(
  "agent-view-state"
);

/**
 * Kit button the approval chrome calls.
 *
 * @public
 */
export interface AgentApprovalButtonProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Part name, so styling can target this element. */
  readonly part: string;
  /** Class for the element. */
  readonly className?: string;
  /** Called when pressed. */
  readonly onClick: () => void;
}

/**
 * Kit region that wraps the proposal list.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface AgentApprovalListProps<TNode = unknown> {
  /** Part name for the list. */
  readonly part: string;
  /** Accessible name for the list. */
  readonly label: string;
  /** Class for the list. */
  readonly className?: string;
  /** The proposal rows. */
  readonly children: TNode;
}

/**
 * Kit-supplied controls for the approval strip's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface AgentApprovalSlots<TNode = unknown> {
  /** Renders the approve control. */
  readonly Approve: (props: AgentApprovalButtonProps) => TNode;
  /** Renders the reject control. */
  readonly Reject: (props: AgentApprovalButtonProps) => TNode;
  /** Renders the proposal list region. */
  readonly List: (props: AgentApprovalListProps<TNode>) => TNode;
  /**
   * Renders a quiet control that decides nothing — opening the full list of
   * changes, or leaving it. A link or tertiary button, never a third
   * decision beside Approve and Reject.
   */
  readonly Action: (props: AgentApprovalButtonProps) => TNode;
}

/**
 * Props for an adapter `AgentApproval` — no slots on the public API.
 *
 * @public
 */
export interface AgentApprovalProps {
  /**
   * The live approval, or nothing.
   *
   * The strip draws only when this is set AND the approval's presentation
   * names the table. Exactly one surface owns a decision: the others may say
   * a write is waiting, but must not offer a second set of buttons for it.
   */
  readonly pending?: AgentApprovalPending | null;
  /** Labels; falls back to the built-in English. */
  readonly labels?: TableLabels;
  /** Class for the strip. */
  readonly className?: string;
  /** Class for each button. */
  readonly buttonClassName?: string;
}

/**
 * Controls a kit supplies to the shared review body.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface ApprovalReviewSlots<TNode = unknown> {
  /** Renders an approve control — the summary one, and one per change. */
  readonly Approve: (props: AgentApprovalButtonProps) => TNode;
  /** Renders a reject control — the summary one, and one per change. */
  readonly Reject: (props: AgentApprovalButtonProps) => TNode;
  /** Renders the list region. */
  readonly List: (props: AgentApprovalListProps<TNode>) => TNode;
  /**
   * Renders a quiet control that decides nothing — opening the full list,
   * or going back to the conversation. Adapters draw it as a link or a
   * tertiary button, never as a third decision.
   */
  readonly Action: (props: AgentApprovalButtonProps) => TNode;
}
