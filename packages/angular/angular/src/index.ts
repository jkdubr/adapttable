/**
 * `@adapttable/angular` — the headless Angular binding. Signals over the
 * framework-neutral stores in `@adapttable/core`: URL-synced view state, the
 * frontend data tier and the headless table, with columns whose renderers
 * are Angular templates or components, and features composed through
 * dependency injection.
 *
 * @packageDocumentation
 */
export { AdaptLiveRegion } from "./a11y/liveRegion";
export {
  type BulkActionRunnerOptions,
  type BulkActionRunnerState,
  injectBulkActionRunner,
  rowActionsFor,
  type RowActionsOptions,
} from "./actions/bulkActionRunner";
export { AdaptAttrs, type Attrs } from "./attrs";
export {
  AdaptCell,
  AdaptCellTemplate,
  AdaptHeader,
  type ResolvedRenderer,
} from "./cell";
export {
  type CellContext,
  type ColumnDef,
  type HeaderContext,
  type Renderer,
  resolveColumns,
} from "./columnDef";
export {
  type ColumnLayout,
  type ColumnLayoutOptions,
} from "./columns/columnLayout";
export {
  type ColumnDrag,
  type ColumnRenameEditorOptions,
  type ColumnRenameEditorState,
  injectColumnDrag,
  injectColumnRenameEditor,
} from "./columns/columnMenu";
export { AdaptControl } from "./control";
export {
  type DataTable,
  type DataTableOptions,
  injectDataTable,
} from "./dataTable";
export {
  type BatchEditHandler,
  type BatchEditingInjectOptions,
  type CellEditHandler,
  type CellEditingOptions,
  injectBatchEditing,
  injectCellEditing,
  injectRowEditing,
  type RowEditHandler,
  type RowEditingInjectOptions,
} from "./editing/editing";
export {
  ADAPTTABLE_FEATURES,
  type AdaptTableFeature,
  extendFeature,
  featureOptionsOf,
  provideAdaptTableFeatures,
  type SlotComponent,
} from "./featureHost";
export {
  cellNavigation,
  type CellNavigationOptions,
} from "./features/cellNavigation";
export { batchEditing, editing, rowEditing } from "./features/editing";
export {
  groupingPanel,
  type GroupingPanelExtras,
} from "./features/groupingPanel";
export { rowReorder } from "./features/rowReorder";
export { virtualize, type VirtualizeOptions } from "./features/virtualize";
export {
  AdaptChecklistChrome,
  type ChecklistSlots,
} from "./filters/checklistChrome";
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
} from "./filters/filters";
export {
  AdaptFilterTreeChrome,
  type AngularFilterTreeDisclosureProps,
  type FilterTreeSlots,
} from "./filters/filterTreeChrome";
export {
  type GridFocus,
  type GridFocusOptions,
  injectGridFocus,
} from "./focus/gridFocus";
export {
  AdaptGroupingPanelChrome,
  type AngularGroupingPanelAggregationItemProps,
  type AngularGroupingPanelSurfaceProps,
  type GroupingPanelSlots,
} from "./grouping/groupingPanelChrome";
export {
  type GroupingPanelStateOptions,
  injectGroupingPanelState,
} from "./grouping/groupingPanelState";
export { injectIsMobile, type IsMobileOptions } from "./hooks/isMobile";
export { AdaptIcon } from "./icon";
export * from "./kitExports";
export {
  type DensityOptions,
  type DensityState,
  type ExportCsvHandlerOptions,
  injectDensity,
  injectExportCsv,
  injectFullscreen,
} from "./layout/toolbar";
export {
  injectRowReorder,
  type RowReorderState,
  type RowReorderStateOptions,
} from "./rows/rowReorder";
export {
  AdaptRowReorderAnnouncer,
  AdaptRowReorderButtonsChrome,
  AdaptRowReorderHandleChrome,
  type RowReorderButtonsProps,
  type RowReorderButtonsSlots,
  type RowReorderHandleProps,
  type RowReorderHandleSlotProps,
  type RowReorderHandleSlots,
} from "./rows/rowReorderHandle";
export {
  injectRowSelection,
  type RowSelection,
  type RowSelectionOptions,
} from "./selection/selection";
export {
  AdaptSlot,
  ADAPTTABLE_SLOT_TABLE,
  type SlotFills,
  type SlotTable,
} from "./slots";
export {
  type FrontendDataOptions,
  injectFrontendData,
} from "./source/frontendData";
export {
  type ExternalStore,
  fromStore,
  type FromStoreOptions,
  type MaybeSignal,
  type MaybeSignalOptional,
} from "./store";
export {
  injectSavedViews,
  type SavedViewsOptions,
  type SavedViewsState,
} from "./url/savedViews";
export {
  ADAPTTABLE_URL_ADAPTER,
  injectTableUrlState,
  type TableUrlState,
  type TableUrlStateOptions,
  urlAdapterFor,
} from "./url/tableUrlState";
export {
  injectKeyedVirtualization,
  injectKeyedVirtualizer,
  injectTableVirtualization,
  injectTableVirtualizer,
  type KeyedVirtualizationOptions,
  type TableVirtualizationOptions,
} from "./virtual/tableVirtualization";
export type {
  BatchEditingState,
  BatchRowEdit,
  CellEditingState,
  RowEditingState,
} from "@adapttable/core";
export type { RowReorderHandler, RowReorderOptions } from "@adapttable/core";
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
  beginCellEdit,
  isCellEditable,
  parseCellEditValue,
  readEditableCellValue,
  resolveCellEditor,
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
