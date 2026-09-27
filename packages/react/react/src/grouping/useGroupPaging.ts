/**
 * How much of a paged group model has been asked for — the React side of
 * core's group paging controller.
 */
import {
  createGroupPagingController,
  type GroupPaging,
} from "@adapttable/core";
import { useMemo, useState, useSyncExternalStore } from "react";

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

/**
 * Track how much of a paged group model is showing.
 *
 * @returns The state; inert until something calls `showMore`.
 *
 * @public
 */
export function useGroupPaging(): GroupPagingState {
  const [controller] = useState(createGroupPagingController);
  const paging = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  );
  const { showMore, reset } = controller;

  return useMemo(
    () => ({ paging, showMore, reset }),
    [paging, showMore, reset]
  );
}
