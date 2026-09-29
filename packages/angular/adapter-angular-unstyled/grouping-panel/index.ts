/**
 * Interactive grouping strip — `@adapttable/angular-unstyled/grouping-panel`.
 *
 * @packageDocumentation
 */
import {
  type AdaptTableFeature,
  extendFeature,
  GROUPING_PANEL,
  groupingPanel as coreAngularGroupingPanel,
  type GroupingPanelExtras,
  slotRender,
} from "@adapttable/angular";
import { AdaptGroupingPanel } from "@adapttable/angular-unstyled";

/**
 * The interactive grouping strip: chips, carets, aggregations and the
 * ungroup target, drawn with native controls. The panel owns the group-by
 * state; composing it turns grouping on.
 *
 * @param groupBy - Initial grouping keys; a URL that already carries one keeps it.
 * @param extras - Row-aware aggregate options.
 *
 * @public
 */
export function groupingPanel<TRow = unknown>(
  groupBy?: string | readonly string[],
  extras: GroupingPanelExtras<TRow> = {}
): AdaptTableFeature {
  return extendFeature(coreAngularGroupingPanel(groupBy, extras), [
    slotRender(GROUPING_PANEL, () => AdaptGroupingPanel),
  ]);
}
