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
  coreDensityChooser,
  coreExportCsv,
  coreFilters,
  coreFullscreen,
  coreHeaderFilters,
  coreRowActions,
  coreSavedViews,
  type ExportCsvOptions,
  extendFeature,
  FILTER_DRAWER,
  FILTER_HEADER,
  FILTER_POPOVER,
  type FilterDef,
  FILTERS_FORM,
  GROUPING_PANEL,
  groupingPanel as coreAngularGroupingPanel,
  type GroupingPanelExtras,
  type RowAction,
  type RowActionsLayout,
  SAVED_VIEWS,
  type SavedViewsControllerOptions,
  slotRender,
  TOOLBAR_EXTRAS,
  virtualize as coreAngularVirtualize,
  type VirtualizeOptions,
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
import { AdaptGroupingPanel } from "./groupingPanel";
import { AdaptSavedViewsMenu } from "./savedViews";
import {
  AdaptDensityButton,
  AdaptExportButton,
  AdaptFullscreenButton,
} from "./toolbarExtras";

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

/**
 * A toolbar button that switches between comfortable and compact rows. The
 * choice is kept in the URL.
 *
 * @public
 */
export function densityChooser(): AdaptTableFeature {
  return extendFeature(coreDensityChooser(), [
    slotRender(TOOLBAR_EXTRAS, () => AdaptDensityButton, {
      orderAs: "density-chooser",
    }),
  ]);
}

/**
 * A toolbar button that takes the table fullscreen, where the browser
 * allows it.
 *
 * @public
 */
export function fullscreen(): AdaptTableFeature {
  return extendFeature(coreFullscreen(), [
    slotRender(TOOLBAR_EXTRAS, () => AdaptFullscreenButton, {
      orderAs: "fullscreen",
    }),
  ]);
}

/**
 * CSV export of the current view, from a toolbar button.
 *
 * @param options - `true`, or the export's scope, columns, filename,
 *   writer and hooks.
 *
 * @public
 */
export function exportCsv<TRow>(
  options: boolean | ExportCsvOptions<TRow> = true
): AdaptTableFeature {
  return extendFeature(
    coreExportCsv(options as Parameters<typeof coreExportCsv>[0]),
    [
      slotRender(TOOLBAR_EXTRAS, () => AdaptExportButton, {
        orderAs: "export-csv",
      }),
    ]
  );
}

/**
 * Named snapshots of the table's view — search, sort, filters, paging and
 * layout — from a toolbar menu.
 *
 * @param options - Where the views are kept: a storage key, and optionally
 *   a storage or a server store. The table supplies its URL backend.
 *
 * @public
 */
export function savedViews(
  options: SavedViewsControllerOptions
): AdaptTableFeature {
  return extendFeature(coreSavedViews(options), [
    slotRender(SAVED_VIEWS, () => AdaptSavedViewsMenu),
  ]);
}

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

/**
 * Render only the rows in view. Compose with `paginationMode="infinite"`
 * (or a grouped/tree page): a flat paged table already bounds what is
 * mounted, so the window stays off.
 *
 * @param options - Master switch or the windowing knobs.
 *
 * @public
 */
export function virtualize(
  options: VirtualizeOptions = true
): AdaptTableFeature {
  return coreAngularVirtualize(options);
}
