/**
 * Measuring a row that carries an expanded detail panel beneath it.
 *
 * A virtualizer sizes one item by measuring one element. A row with an open
 * detail panel is two elements — a table cannot nest the panel inside the row
 * it belongs to, because a `<tr>` may only contain cells — so measuring the row
 * alone reports 56px for something 300px tall. Scroll positions then drift as
 * soon as anything is expanded, which is the whole reason row detail carried a
 * "not recommended with virtualize" warning.
 *
 * So the pair is measured as a pair: both elements are observed, and their
 * combined height is handed to the virtualizer through `resizeItem`. The
 * virtualizer keeps owning the layout; it is simply told the truth about how
 * tall the item is.
 */
import {
  RowPairMeasureController,
  type RowPairMeasurer,
} from "@adapttable/core/binding";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * What a virtualizer must offer for a pair to be measurable.
 *
 * @public
 */
export interface ResizableVirtualizer {
  /** Tell the virtualizer an item's real size. */
  resizeItem: (index: number, size: number) => void;
}

export type { RowPairMeasurer } from "@adapttable/core/binding";

/**
 * Measure each row together with its open detail panel.
 *
 * Sizes are reported on every resize of either half, so a detail panel that
 * grows — an image loading, a nested table expanding — corrects the item's
 * height rather than leaving the scrollbar wrong until the next scroll.
 *
 * @param virtualizer - The virtualizer to report sizes to.
 * @param enabled - Off when nothing is virtualized or nothing can expand, in
 *   which case the returned refs do nothing at all.
 * @returns Ref callbacks for a row and its detail.
 *
 * @public
 */
export function useRowPairMeasurer(
  virtualizer: ResizableVirtualizer | undefined,
  enabled: boolean
): RowPairMeasurer {
  // One controller for the table's life: the pairs it tracks outlive a
  // virtualizer swap (page to box scrolling), which reads through the ref.
  const latest = useRef(virtualizer);
  latest.current = virtualizer;
  const [controller] = useState(
    () =>
      new RowPairMeasureController((index, size) =>
        latest.current?.resizeItem(index, size)
      )
  );

  useEffect(
    () => (enabled ? controller.connect() : undefined),
    [controller, enabled]
  );

  const attach = useCallback(
    (index: number, half: "row" | "detail") => (node: Element | null) => {
      if (enabled) controller.attach(index, half, node);
    },
    [controller, enabled]
  );

  return useMemo(
    () => ({
      row: (index: number) => attach(index, "row"),
      detail: (index: number) => attach(index, "detail"),
    }),
    [attach]
  );
}
