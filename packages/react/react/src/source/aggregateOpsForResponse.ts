/**
 * Which aggregate operations the rows ON SCREEN were computed with, for the
 * React tiers that do not run on a core source. The rules live in core's
 * {@link createResponseAggregateOps}; this hook settles them after commit.
 */
import {
  createResponseAggregateOps,
  type GroupAggregateOps,
  type ResponseAggregateOpsInput,
} from "@adapttable/core";
import { useEffect, useState } from "react";

/**
 * What the caller knows about the request in flight and the response drawn.
 *
 * @internal
 */
export type AggregateOpsForResponse = ResponseAggregateOpsInput;

/**
 * The operations behind the displayed response.
 *
 * @param input - See {@link AggregateOpsForResponse}.
 * @returns The operations, or `undefined` when nothing is known.
 *
 * @internal
 */
export function useAggregateOpsForResponse(
  input: AggregateOpsForResponse
): GroupAggregateOps | undefined {
  const {
    requestKey,
    requested,
    responseKey,
    respondedAt,
    hasData,
    fetching,
    failed,
  } = input;
  const [tracker] = useState(createResponseAggregateOps);
  const [displayed, setDisplayed] = useState(requested);

  // Remember this request's operations before anything can answer it.
  tracker.remember(requestKey, requested);

  useEffect(() => {
    const moved = tracker.settle({
      requestKey,
      requested,
      responseKey,
      respondedAt,
      hasData,
      fetching,
      failed,
    });
    if (moved) setDisplayed(tracker.current());
  }, [
    tracker,
    requestKey,
    requested,
    responseKey,
    respondedAt,
    hasData,
    fetching,
    failed,
  ]);

  return displayed;
}
