/**
 * The interactive grouping panel feature for Angular.
 */
import { coreGroupingPanel } from "@adapttable/core/binding";

import type { AdaptTableFeature } from "../featureHost";

/**
 * Extras the grouping panel accepts, matching React's shape so a kit can
 * declare aggregates the same way.
 *
 * @public
 */
export interface GroupingPanelExtras<TRow = unknown> {
  /** Per-group subtotals, the same mapper shape as a summary row. */
  readonly groupAggregates?: (rows: readonly TRow[]) => unknown;
}

/**
 * A grouping-panel feature that also carries the seed keys and extras the
 * controller reads once.
 */
interface GroupingPanelFeature<TRow = unknown> extends AdaptTableFeature {
  readonly initialGroupBy?: string | readonly string[];
  readonly extras?: GroupingPanelExtras<TRow>;
}

/**
 * Interactive row grouping: the panel owns the group-by state, and a kit
 * fills {@link GROUPING_PANEL} with its own strip.
 *
 * The binding ships only the feature's configuration. The unstyled kit (or
 * any other kit) extends this with `slotRender(GROUPING_PANEL, …)`.
 *
 * @param groupBy - Initial grouping keys; the URL keeps whatever it already has.
 * @param extras - Row-aware aggregate options.
 * @returns The feature.
 *
 * @public
 */
export function groupingPanel<TRow = unknown>(
  groupBy?: string | readonly string[],
  extras: GroupingPanelExtras<TRow> = {}
): AdaptTableFeature {
  return {
    ...coreGroupingPanel<TRow>(groupBy, extras),
    initialGroupBy: groupBy,
    extras,
  } as GroupingPanelFeature<TRow>;
}

export type { GroupingPanelFeature };
