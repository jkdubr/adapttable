/**
 * The unstyled kit's features: each one turns a capability on and fills its
 * slot with this kit's native controls. A table composes only the features
 * it lists, and an unlisted feature's components stay out of the build.
 */
import {
  ACTIVE_FILTER_CHIPS,
  type AdaptTableFeature,
  COLUMN_MENU,
  coreColumnMenu,
  coreFilters,
  coreHeaderFilters,
  extendFeature,
  FILTER_DRAWER,
  FILTER_HEADER,
  FILTER_POPOVER,
  type FilterDef,
  FILTERS_FORM,
  slotRender,
} from "@adapttable/angular";

import { AdaptColumnMenu } from "./columnMenu";
import {
  AdaptFilterChips,
  AdaptFilterDrawer,
  AdaptFilterPopover,
  AdaptFiltersForm,
  AdaptHeaderFilterTrigger,
} from "./filterOverlays";

/**
 * The Columns menu: show, hide, reorder, pin, rename and auto-size columns,
 * drawn with a native button and popover.
 *
 * @public
 */
export function columnMenu(): AdaptTableFeature {
  return extendFeature(coreColumnMenu(), [
    slotRender(COLUMN_MENU, () => AdaptColumnMenu),
  ]);
}

/**
 * Declarative filters: the Filters button with an anchored popover (or the
 * drawer, with `filtersMode="drawer"`), the nested AND/OR builder, one
 * native field per definition, and removable chips for what is active.
 *
 * @param defs - The filter definitions. Columns that declare `filter` add
 *   theirs.
 *
 * @public
 */
export function filters<TRow>(
  defs: readonly FilterDef<TRow>[] = []
): AdaptTableFeature {
  return extendFeature(coreFilters(defs), [
    slotRender(FILTERS_FORM, () => AdaptFiltersForm),
    slotRender(FILTER_POPOVER, () => AdaptFilterPopover),
    slotRender(FILTER_DRAWER, () => AdaptFilterDrawer),
    slotRender(ACTIVE_FILTER_CHIPS, () => AdaptFilterChips),
  ]);
}

/**
 * A filter funnel on every filterable column's header, opening that
 * column's field in place.
 *
 * @public
 */
export function headerFilters(): AdaptTableFeature {
  return extendFeature(coreHeaderFilters(), [
    slotRender(FILTER_HEADER, () => AdaptHeaderFilterTrigger),
  ]);
}
