/**
 * `@adapttable/angular` — the headless Angular binding. Signals over the
 * framework-neutral stores in `@adapttable/core`: URL-synced view state, the
 * frontend data tier and the headless table, with columns whose renderers
 * are Angular templates or components, and features composed through
 * dependency injection.
 *
 * @packageDocumentation
 */
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
  type DataTable,
  type DataTableOptions,
  injectDataTable,
} from "./dataTable";
export {
  ADAPTTABLE_FEATURES,
  type AdaptTableFeature,
  provideAdaptTableFeatures,
} from "./features";
export { type FrontendDataOptions, injectFrontendData } from "./frontendData";
export {
  type GridFocus,
  type GridFocusOptions,
  injectGridFocus,
} from "./gridFocus";
export { AdaptLiveRegion } from "./liveRegion";
export { injectIsMobile, type IsMobileOptions } from "./mobile";
export {
  injectRowSelection,
  type RowSelection,
  type RowSelectionOptions,
} from "./selection";
export {
  type ExternalStore,
  fromStore,
  type FromStoreOptions,
  type MaybeSignal,
  type MaybeSignalOptional,
} from "./store";
export {
  ADAPTTABLE_URL_ADAPTER,
  injectTableUrlState,
  type TableUrlState,
  type TableUrlStateOptions,
} from "./url";
export type {
  CellRange,
  Direction,
  ExtraFilters,
  GridCell,
  PaginationInfo,
  PaginationSlot,
  SortDirection,
  TableLabels,
  TableQueryParams,
  TableSource,
} from "@adapttable/core";
export type {
  ChromeBodyRegion,
  HeaderSelectionState,
} from "@adapttable/core/binding";
