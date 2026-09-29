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
export {
  ACTIONS_COLUMN_KEY,
  columnMenuRows,
  nextPinSide,
  pinActionLabel,
  REORDER_COLUMN_KEY,
} from "@adapttable/core";
export type {
  ColumnMenuSlotProps,
  FeatureRender,
  FeatureSlotKey,
  IconDescriptor,
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
