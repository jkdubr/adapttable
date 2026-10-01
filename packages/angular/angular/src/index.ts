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
export { AdaptTableStatusAnnouncer } from "./a11y/tableStatusAnnouncer";
export {
  type BulkActionRunnerOptions,
  type BulkActionRunnerState,
  injectBulkActionRunner,
  rowActionsFor,
  type RowActionsOptions,
} from "./actions/bulkActionRunner";
export {
  aggregate,
  type AggregateOptions,
  type AggregateSpec,
  type SummaryRowFn,
} from "./aggregate/aggregate";
export { AdaptAttrs, type Attrs } from "./attrs";
export {
  AdaptCell,
  AdaptCellTemplate,
  AdaptFooter,
  AdaptHeader,
  type ResolvedRenderer,
} from "./cell";
export {
  type CellContext,
  type ColumnDef,
  type ColumnGroup,
  type ColumnInput,
  flattenColumns,
  type FooterContext,
  type HeaderContext,
  type Renderer,
  resolveColumns,
} from "./columnDef";
export {
  AdaptColumnGroupToggleChrome,
  type ColumnGroupToggleButtonProps,
  type ColumnGroupToggleProps,
  type ColumnGroupToggleSlots,
} from "./columns/columnGroupToggle";
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
export {
  type ColumnResizeHandleProps,
  injectColumnResize,
} from "./columns/columnResize";
export { AdaptControl } from "./control";
export {
  type DataTable,
  type DataTableOptions,
  injectDataTable,
} from "./dataTable";
export {
  type EditableCellController,
  editableCellController,
  type EditableCellEditing,
  type EditableCellMode,
  type EditingBundle,
  focusEditorOnMount,
  rowEditingSignature,
  rowIsDirty,
  stopCellEditKeyboard,
} from "./editing/editableCellController";
export {
  AdaptCellConflictNotice,
  AdaptEditableCellGate,
  type CellConflictAsk,
  type CellConflictNoticeProps,
  commitBooleanDraft,
  type EditableCellActivateProps,
  type EditableCellButtonProps,
  type EditableCellEditorCtrl,
  type EditableCellSlots,
  editorBusyProps,
  editorValidationProps,
  multiDraftFromSelect,
  stopEditKeys,
} from "./editing/editableCellGate";
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
  AdaptBatchEditBarChrome,
  AdaptBatchEditCell,
  AdaptRowEditActionsChrome,
  AdaptRowEditCell,
  type BatchEditBarProps,
  type BatchEditBarSlots,
  type BatchEditButtonProps,
  type RowEditActionsProps,
  type RowEditActionsSlots,
  type RowEditButtonProps,
  type RowEditConflict,
  type RowEditControls,
  rowEditControls,
  type RowEditControlsOptions,
  type RowEditIcons,
} from "./editing/rowEditGate";
export {
  type CellSaveStateInjectOptions,
  injectCellSaveState,
} from "./editing/saveState";
export {
  type EditValidationInjectOptions,
  injectEditValidation,
} from "./editing/validation";
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
export {
  batchEditing,
  dirtyIndicators,
  editing,
  type EditingLifecycleExtras,
  rowEditing,
} from "./features/editing";
export {
  bulkActions,
  cellSpan,
  collapsibleColumnGroups,
  columnMenu,
  columnSelectionCheckbox,
  commandPalette,
  type CommandPaletteOptions,
  contextMenu,
  type ContextMenuOptions,
  extraRows,
  feature,
  fitColumns,
  headerFilters,
  multiSort,
  pinnedSummaryRows,
  print,
  resizableColumns,
  rowAppearance,
  type RowAppearanceOptions,
  savedViews,
  sidePanel,
  type SidePanelOptions,
  statusBar,
  undoRedoButtons,
} from "./features/factories";
export { findInTable } from "./features/findInTable";
export {
  grouping,
  type GroupingExtras,
  type GroupingOptions,
  type GroupSort,
  injectGrouping,
  type TableGrouping,
} from "./features/grouping";
export {
  groupingPanel,
  type GroupingPanelExtras,
} from "./features/groupingPanel";
export {
  injectRowDetail,
  nestedTable,
  rowDetail,
  type RowDetailOptions,
  type TableRowDetail,
} from "./features/rowDetail";
export {
  injectTableRowPinning,
  rowPinning,
  type RowPinningFeatureOptions,
  type TableRowPinningOptions,
} from "./features/rowPinning";
export { rowReorder } from "./features/rowReorder";
export {
  injectTree,
  type TableTree,
  tree,
  type TreeFeatureOptions,
  type TreeOptions,
} from "./features/tree";
export { virtualize, type VirtualizeOptions } from "./features/virtualize";
export {
  AdaptChecklistChrome,
  type ChecklistSlots,
} from "./filters/checklistChrome";
export {
  AdaptFilterHeaderChrome,
  AdaptFilterHeaderControlChrome,
  type FilterHeaderSlots,
} from "./filters/filterHeaderRow";
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
export { injectHeaderFilterOverlay } from "./filters/headerFilterOverlay";
export { AdaptFindBarChrome, type FindBarSlots } from "./find/findBar";
export { type FindInTableOptions, injectFindInTable } from "./find/findInTable";
export {
  findMarkAttrs,
  injectFindFocus,
  injectFindScroll,
  injectFindShortcut,
  injectFindWindowScroll,
} from "./find/findMarks";
export { ADAPTTABLE_FIND_STATE } from "./find/findState";
export {
  AdaptColumnSelectCheckboxChrome,
  type ColumnSelectCheckboxProps,
  columnSelectLabel,
  type ColumnSelectSlots,
} from "./focus/columnSelectCheckbox";
export {
  type GridFocus,
  type GridFocusOptions,
  injectGridFocus,
} from "./focus/gridFocus";
export {
  type GroupCollapseOptions,
  type GroupCollapseState,
  injectGroupCollapse,
} from "./grouping/groupCollapse";
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
export {
  AdaptGroupMoreButtonChrome,
  type GroupMoreButtonProps,
  type GroupMoreButtonSlotProps,
  type GroupMoreButtonSlots,
} from "./grouping/groupMoreButton";
export {
  type GroupPagingOptions,
  type GroupPagingState,
  injectGroupPaging,
} from "./grouping/groupPaging";
export { AdaptGroupToggleSpacer } from "./grouping/groupToggleSpacer";
export { injectIsMobile, type IsMobileOptions } from "./hooks/isMobile";
export { injectMediaQuery } from "./hooks/mediaQuery";
export { injectPrefersReducedMotion } from "./hooks/prefersReducedMotion";
export { AdaptIcon } from "./icon";
export * from "./kitExports";
export type { RuntimeGrouping } from "./layout/tableRuntime";
export {
  type DensityOptions,
  type DensityState,
  type ExportCsvHandlerOptions,
  injectDensity,
  injectExportCsv,
  injectFullscreen,
} from "./layout/toolbar";
export {
  type ChangedCellFlash,
  type ChangedCellFlashOptions,
  injectChangedCellFlash,
} from "./rows/changedCellFlash";
export { AdaptExtraRowContent } from "./rows/extraRowContent";
export { type Highlight, injectHighlight } from "./rows/highlight";
export {
  injectRowExpansion,
  type RowExpansionOptions,
  type RowExpansionState,
} from "./rows/rowExpansion";
export {
  injectRowPinning,
  type RowPinLabels,
  type RowPinningOptions,
  type RowPinningState,
  type RowPinSide,
} from "./rows/rowPinning";
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
  type InfiniteQuerySignals,
  injectQuerySource,
  type QuerySourceOptions,
} from "./source/querySource";
export {
  injectServerData,
  type ServerDataOptions,
  type TableQueryHandler,
} from "./source/serverData";
export {
  injectTableData,
  type TableDataOptions,
  type TableDataResult,
} from "./source/tableData";
export {
  type ExternalStore,
  fromStore,
  type FromStoreOptions,
  type MaybeSignal,
  type MaybeSignalOptional,
  readMaybe,
} from "./store";
export {
  injectLazyChildren,
  type LazyChildrenInjectOptions,
  type LazyChildrenState,
} from "./tree/lazyChildren";
export {
  AdaptRowDetail,
  type NestedTable,
  type NestedTableContext,
  type NestedTableDefaults,
  type NestedTableFor,
  type NestedTableParent,
  type RowDetailContext,
} from "./tree/nestedTable";
export { AdaptTreeCellChrome } from "./tree/treeCell";
export {
  injectTreeExpansion,
  type TreeExpansionOptions,
  type TreeExpansionState,
} from "./tree/treeExpansion";
export {
  AdaptTreeToggleChrome,
  type TreeToggleButtonProps,
  type TreeToggleProps,
  type TreeToggleSlots,
} from "./tree/treeToggle";
export {
  type ColumnLayoutUrlState,
  type ColumnLayoutUrlStateOptions,
  injectColumnLayoutUrlState,
} from "./url/columnLayoutUrlState";
export {
  type DensityUrlState,
  type DensityUrlStateOptions,
  injectDensityUrlState,
} from "./url/densityUrlState";
export {
  type GroupCollapseUrlState,
  type GroupCollapseUrlStateOptions,
  injectGroupCollapseUrlState,
} from "./url/groupCollapseUrlState";
export {
  injectRowPinningUrlState,
  type RowPinningUrlState,
} from "./url/rowPinningUrlState";
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
  injectUrlSlice,
  type UrlSlice,
  type UrlSliceOptions,
} from "./url/urlSlice";
export { AdaptColumnSpacer } from "./virtual/columnSpacer";
export {
  type ColumnWindow,
  type ColumnWindowOptions,
  injectColumnWindow,
} from "./virtual/columnWindow";
export {
  injectRowPairMeasurer,
  type ResizableVirtualizer,
  type RowPairMeasurer,
  type RowPairMeasurerOptions,
} from "./virtual/measureRowPair";
export {
  injectKeyedVirtualization,
  injectKeyedVirtualizer,
  injectTableVirtualization,
  injectTableVirtualizer,
  type KeyedVirtualizationOptions,
  type TableVirtualizationOptions,
} from "./virtual/tableVirtualization";
export {
  injectMeasuredWindowScrollMargin,
  type MeasuredWindowScrollMarginOptions,
} from "./virtual/windowScrollMargin";
export type {
  EditEvent,
  EditEventHandler,
  EditLifecycle,
  EditUnit,
} from "@adapttable/core";
export type {
  BatchEditingState,
  BatchRowEdit,
  CellEditingState,
  RowEditingState,
} from "@adapttable/core";
export type { RowReorderHandler, RowReorderOptions } from "@adapttable/core";
export type {
  CellRange,
  CellSpanAppearance,
  Command,
  ContextMenuItem,
  ContextMenuTarget,
  Direction,
  ExtraFilters,
  ExtraRow,
  FacetMap,
  GetCellSpan,
  GridCell,
  KeyedVirtualization,
  PaginatedResponse,
  PaginationInfo,
  PaginationMode,
  PaginationSlot,
  PinnedRows,
  QueryAggregate,
  QuerySupport,
  RowHeight,
  RowStyle,
  Shortcut,
  SortDirection,
  TableLabels,
  TableQuery,
  TableQueryParams,
  TableSource,
  TableVirtualization,
  TreeEntry,
  VirtualTableRow,
} from "@adapttable/core";
export type {
  FeaturePatch,
  RowPinState,
  SidePanelEntry,
} from "@adapttable/core/binding";
export type {
  ChromeBodyRegion,
  HeaderSelectionState,
} from "@adapttable/core/binding";
