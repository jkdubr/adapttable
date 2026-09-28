/**
 * Review strip for a pending agent write.
 *
 * Structure, keyboard, and part names live here. Every visible control is a
 * required kit slot — core never draws a button. Invisible live-region
 * announcements are the one thing this chrome owns itself.
 */
import { approvalReview } from "@adapttable/core";
import type {
  AgentApprovalListProps as NeutralAgentApprovalListProps,
  AgentApprovalProps,
  AgentApprovalSlots as NeutralAgentApprovalSlots,
} from "@adapttable/core/binding";
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { LiveRegion } from "../a11y/LiveRegion";
import { ApprovalReviewChrome } from "./ApprovalReviewChrome";

// The contracts a surface is handed now live in core, where an adapter can
// name them without an AI runtime in its graph. Re-exported here because this
// is where every kit already imports them from.
export type {
  AgentApprovalDecision,
  AgentApprovalOperation,
  AgentApprovalPending,
  AgentApprovalProposal,
  AgentProgress,
} from "@adapttable/core";

// The feature-state keys and plain contracts live in core too, so every
// binding publishes and reads the same ids.
export {
  AGENT_ALWAYS_ALLOW_STATE,
  AGENT_APPROVAL_STATE,
  AGENT_PROGRESS_STATE,
  AGENT_VIEW_STATE,
  type AgentAlwaysAllowState,
  type AgentApprovalButtonProps,
  type AgentApprovalProps,
  type AgentViewState,
} from "@adapttable/core/binding";

/**
 * Kit region that wraps the proposal list — `@adapttable/core`'s
 * `AgentApprovalListProps` with React's node.
 *
 * @public
 */
export type AgentApprovalListProps = NeutralAgentApprovalListProps<ReactNode>;

/**
 * Adapter-supplied controls for {@link AgentApprovalChrome} —
 * `@adapttable/core`'s `AgentApprovalSlots` drawing React nodes.
 *
 * @public
 */
export type AgentApprovalSlots = NeutralAgentApprovalSlots<ReactNode>;

/**
 * Props for {@link AgentApprovalChrome}.
 *
 * @public
 */
export interface AgentApprovalChromeProps extends AgentApprovalProps {
  /** The kit's components for each part. */
  readonly slots: AgentApprovalSlots;
}

/**
 * The strip that asks a reader to approve or reject an agent write.
 *
 * Rendered only while a proposal is pending — a bar that is always there
 * says the table is waiting when it is not. Focus moves into the region
 * when a proposal arrives. Escape rejects. Enter is not a silent confirm.
 *
 * @param props - See {@link AgentApprovalChromeProps}.
 * @returns The strip, or nothing.
 *
 * @public
 */
export function AgentApprovalChrome({
  pending,
  labels,
  className,
  buttonClassName,
  slots,
}: Readonly<AgentApprovalChromeProps>): ReactElement | null {
  const regionRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Only this surface's approvals. A write reviewed in the assistant window
  // must not also grow a set of buttons above the table.
  const mine = pending?.presentation === "table" ? pending : null;
  const review = approvalReview(mine, labels);
  const count = review?.changes ?? 0;
  const hasOperation = review?.operation !== undefined;
  const open = review !== null;
  const reject = mine?.reject;

  useEffect(() => {
    if (!open) {
      setExpanded(false);
      return;
    }
    const root = regionRef.current;
    if (!root) return;
    const first = root.querySelector<HTMLElement>(
      '[data-adapttable-part="agent-approval-reject"]'
    );
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        reject?.();
      }
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [open, count, hasOperation, reject]);

  if (!review || !mine) return null;

  return (
    <section
      ref={regionRef}
      data-adapttable-part="agent-approval"
      className={className}
      aria-label={review.summary}
      tabIndex={-1}
    >
      <LiveRegion part="agent-approval-status" statusRole={false}>
        {review.summary}
      </LiveRegion>
      <ApprovalReviewChrome
        review={review}
        {...(labels ? { labels } : {})}
        slots={slots}
        expanded={expanded}
        onExpand={() => setExpanded(true)}
        onBack={() => setExpanded(false)}
        onApprove={mine.approve}
        onReject={mine.reject}
        {...(mine.decideAt ? { onDecide: mine.decideAt } : {})}
        {...(mine.alwaysAllow ? { onAlwaysAllow: mine.alwaysAllow } : {})}
        {...(className ? { className } : {})}
        {...(buttonClassName ? { buttonClassName } : {})}
      />
    </section>
  );
}
