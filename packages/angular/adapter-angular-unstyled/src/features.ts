/**
 * The unstyled kit's features: each one turns a capability on and fills its
 * slot with this kit's native controls. A table composes only the features
 * it lists, and an unlisted feature's components stay out of the build.
 */
import {
  ACTIVE_FILTER_CHIPS,
  type AdaptTableFeature,
  BULK_BAR,
  type BulkAction,
  COLUMN_MENU,
  coreBulkActions,
  coreColumnMenu,
  coreFilters,
  coreHeaderFilters,
  coreRowActions,
  extendFeature,
  FILTER_DRAWER,
  FILTER_HEADER,
  FILTER_POPOVER,
  type FilterDef,
  FILTERS_FORM,
  type RowAction,
  type RowActionsLayout,
  slotRender,
} from "@adapttable/angular";

import { AdaptBulkBar } from "./actions";
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

/**
 * Actions that run against the selected rows. Composing it makes the rows
 * selectable and shows the selection bar while any row is selected.
 *
 * @param actions - The bulk actions.
 *
 * @public
 */
export function bulkActions(actions: readonly BulkAction[]): AdaptTableFeature {
  return extendFeature(coreBulkActions(actions), [
    slotRender(BULK_BAR, () => AdaptBulkBar),
  ]);
}

/**
 * Options for {@link rowActions}.
 *
 * @public
 */
export interface RowActionsFeatureOptions<TRow> {
  /** A strip of buttons (the default), or a menu behind one button. */
  readonly layout?: RowActionsLayout;
  /** Duplicate a row: adds a Duplicate action. */
  readonly onDuplicateRow?: (row: TRow) => void;
  /** Delete a row: adds a Delete action, confirmed unless told not to. */
  readonly onDeleteRow?: (row: TRow) => void;
  /** Ask before Delete. Defaults to `true`. */
  readonly confirmDeleteRow?: boolean;
}

/**
 * A trailing actions column, and the same actions on each phone card. The
 * table never changes the data: each action is a callback to the host.
 *
 * @param actions - The row actions.
 * @param options - See {@link RowActionsFeatureOptions}.
 *
 * @public
 */
export function rowActions<TRow>(
  actions: readonly RowAction<TRow>[] = [],
  options: RowActionsFeatureOptions<TRow> = {}
): AdaptTableFeature {
  const base = coreRowActions(actions, {
    onDuplicateRow: options.onDuplicateRow,
    onDeleteRow: options.onDeleteRow,
    confirmDeleteRow: options.confirmDeleteRow,
  });
  return {
    ...base,
    apply: (input) => ({
      ...base.apply?.(input),
      rowActionsLayout: options.layout,
    }),
  };
}
