/**
 * The core names Angular kits draw with, re-exported so a kit imports only
 * `@adapttable/angular`. A kit never imports `@adapttable/core`: the binding
 * decides how its framework sees each name.
 */
export type {
  ColumnLayoutState,
  ColumnMenuChoice,
  ColumnMenuItem,
  ColumnMenuLabels,
  ColumnMenuRow,
  PinOffset,
  PinSide,
} from "@adapttable/core";
export type {
  ActiveFilterChip,
  FilterDef,
  FilterFormSource,
  FilterOption,
  FilterRuntime,
  FilterTypeRegistry,
  FilterTypeSpec,
  FilterValue,
  RangeOp,
  RelativePreset,
  TextOp,
} from "@adapttable/core";
export type {
  BulkAction,
  ConfirmHandler,
  RowAction,
  RowActionsLayout,
} from "@adapttable/core";
export type {
  ExportCsvOptions,
  TableDensity,
  UrlStateAdapter,
} from "@adapttable/core";
export type { SavedView, SavedViewsControllerOptions } from "@adapttable/core";
export {
  ACTIONS_COLUMN_KEY,
  columnMenuRows,
  nextPinSide,
  pinActionLabel,
  REORDER_COLUMN_KEY,
} from "@adapttable/core";
export {
  bindHeaderFilterDismiss,
  CHECKLIST_LIST_HEIGHT,
  defaultFilterRegistry,
  filterDefForColumn,
  filterLabel,
  filterOpLabel,
  filterWidgetKind,
  hasActiveHeaderFilter,
  headerFilterInsideSelector,
  joinRelativeToken,
  listFilterValues,
  RELATIVE_PRESET_LABEL_KEYS,
  RELATIVE_PRESETS,
  showSimpleFilterFields,
  splitRelativeToken,
  watchOverlayDismiss,
} from "@adapttable/core";
export {
  bulkActionErrorMessage,
  defaultConfirm,
  offersAllMatching,
  resolveDisabledReason,
  runRowAction,
  visibleRowActions,
} from "@adapttable/core";
export type {
  ColumnMenuSlotProps,
  FeatureRender,
  FeatureSlotKey,
  IconDescriptor,
} from "@adapttable/core/binding";
export type {
  ActiveFilterChipsSlotProps,
  ChecklistButtonProps,
  ChecklistCheckboxProps,
  ChecklistSearchProps,
  FilterHeaderControlProps,
  FilterOverlaySlotProps,
  FiltersFormSlotProps,
  FilterTreeButtonProps,
  FilterTreeInputProps,
  FilterTreeSelectProps,
} from "@adapttable/core/binding";
export type {
  BulkBarSlotProps,
  SelectionState,
} from "@adapttable/core/binding";
export type {
  ExportHandlerState,
  FullscreenState,
  ToolbarExtrasSlotProps,
} from "@adapttable/core/binding";
export type { SavedViewsSlotProps } from "@adapttable/core/binding";
export type { GroupingPanelState } from "@adapttable/core/binding";
export type {
  GroupingPanelAggregationRemoveProps,
  GroupingPanelChecklistProps,
  GroupingPanelChipProps,
  GroupingPanelDropZoneProps,
  GroupingPanelRemoveZoneProps,
  GroupingPanelRestoreProps,
  GroupingPanelSelectProps,
} from "@adapttable/core/binding";
export {
  COLUMN_MENU,
  columnMenuActions,
  coreColumnMenu,
  eyeIcon,
  filterColumnMenuRows,
  GRIP_ICON,
  hideAllColumns,
  PIN_ICON,
  showAllColumns,
  slotRender,
  unpinAllColumns,
} from "@adapttable/core/binding";
export {
  ACTIVE_FILTER_CHIPS,
  coreFilters,
  coreHeaderFilters,
  FILTER_DRAWER,
  FILTER_HEADER,
  FILTER_POPOVER,
  FILTERS_FORM,
  FILTERS_ICON,
  FilterTriggerToggleState,
} from "@adapttable/core/binding";
export {
  BULK_BAR,
  coreBulkActions,
  coreRowActions,
} from "@adapttable/core/binding";
export {
  coreDensityChooser,
  coreExportCsv,
  coreFullscreen,
  TOOLBAR_EXTRAS,
} from "@adapttable/core/binding";
export { coreSavedViews, SAVED_VIEWS } from "@adapttable/core/binding";
