/**
 * `@adapttable/angular` — the headless Angular binding. Signals over the
 * framework-neutral stores in `@adapttable/core`: URL-synced view state, the
 * frontend data tier and the headless table, with columns whose renderers
 * are Angular templates or components, and features composed through
 * dependency injection.
 *
 * @packageDocumentation
 */
export {
  type BulkActionRunnerOptions,
  type BulkActionRunnerState,
  injectBulkActionRunner,
  rowActionsFor,
  type RowActionsOptions,
} from "./actions";
export { AdaptAttrs, type Attrs } from "./attrs";
export {
  AdaptCell,
  AdaptCellTemplate,
  AdaptHeader,
  type ResolvedRenderer,
} from "./cell";
export { AdaptChecklistChrome, type ChecklistSlots } from "./checklist";
export {
  type CellContext,
  type ColumnDef,
  type HeaderContext,
  type Renderer,
  resolveColumns,
} from "./columnDef";
export { type ColumnLayout, type ColumnLayoutOptions } from "./columnLayout";
export {
  type ColumnDrag,
  type ColumnRenameEditorOptions,
  type ColumnRenameEditorState,
  injectColumnDrag,
  injectColumnRenameEditor,
} from "./columnMenu";
export { AdaptControl } from "./control";
export {
  type DataTable,
  type DataTableOptions,
  injectDataTable,
} from "./dataTable";
export {
  ADAPTTABLE_FEATURES,
  type AdaptTableFeature,
  extendFeature,
  featureOptionsOf,
  provideAdaptTableFeatures,
  type SlotComponent,
} from "./features";
export {
  booleanFilterFor,
  filterChipsFor,
  filterOptionsFor,
  type FilterOptionsState,
  filterRuntimeFor,
  type FilterRuntimeOptions,
  rangeFilterFor,
  type TableFilters,
  textFilterFor,
} from "./filters";
export {
  AdaptFilterTreeChrome,
  type AngularFilterTreeDisclosureProps,
  type FilterTreeSlots,
} from "./filterTree";
export { type FrontendDataOptions, injectFrontendData } from "./frontendData";
export {
  type GridFocus,
  type GridFocusOptions,
  injectGridFocus,
} from "./gridFocus";
export {
  groupingPanel,
  type GroupingPanelExtras,
  type GroupingPanelStateOptions,
  injectGroupingPanelState,
} from "./grouping";
export {
  AdaptGroupingPanelChrome,
  type AngularGroupingPanelAggregationItemProps,
  type AngularGroupingPanelSurfaceProps,
  type GroupingPanelSlots,
} from "./groupingPanel";
export { AdaptIcon } from "./icon";
export * from "./kitExports";
export { AdaptLiveRegion } from "./liveRegion";
export { injectIsMobile, type IsMobileOptions } from "./mobile";
export {
  injectSavedViews,
  type SavedViewsOptions,
  type SavedViewsState,
} from "./savedViews";
export {
  injectRowSelection,
  type RowSelection,
  type RowSelectionOptions,
} from "./selection";
export {
  AdaptSlot,
  ADAPTTABLE_SLOT_TABLE,
  type SlotFills,
  type SlotTable,
} from "./slots";
export {
  type ExternalStore,
  fromStore,
  type FromStoreOptions,
  type MaybeSignal,
  type MaybeSignalOptional,
} from "./store";
export {
  type DensityOptions,
  type DensityState,
  type ExportCsvHandlerOptions,
  injectDensity,
  injectExportCsv,
  injectFullscreen,
} from "./toolbar";
export {
  ADAPTTABLE_URL_ADAPTER,
  injectTableUrlState,
  type TableUrlState,
  type TableUrlStateOptions,
  urlAdapterFor,
} from "./url";
export {
  injectKeyedVirtualization,
  injectKeyedVirtualizer,
  injectTableVirtualization,
  injectTableVirtualizer,
  type KeyedVirtualizationOptions,
  type TableVirtualizationOptions,
  virtualize,
  type VirtualizeOptions,
} from "./virtualize";
export type {
  CellRange,
  Direction,
  ExtraFilters,
  GridCell,
  KeyedVirtualization,
  PaginationInfo,
  PaginationMode,
  PaginationSlot,
  SortDirection,
  TableLabels,
  TableQueryParams,
  TableSource,
  TableVirtualization,
  VirtualTableRow,
} from "@adapttable/core";
export {
  devWarn,
  resolveVirtualRows,
  rowSourceIndex,
  virtualColumnSpan,
} from "@adapttable/core";
export type {
  ChromeBodyRegion,
  HeaderSelectionState,
} from "@adapttable/core/binding";
export {
  isBodyEligible,
  virtualizeIgnoredOnPage,
} from "@adapttable/core/binding";
