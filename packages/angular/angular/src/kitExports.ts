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
  FilterTypeSpec,
  FilterFormSource,
  FilterOption,
  FilterRuntime,
  FilterTypeRegistry,
  FilterValue,
  RangeOp,
  RelativePreset,
  TextOp,
} from "@adapttable/core";
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
