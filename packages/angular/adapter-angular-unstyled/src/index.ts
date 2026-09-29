/**
 * `@adapttable/angular-unstyled` — the Angular table drawn with native HTML
 * and no styles of its own, over `@adapttable/angular`.
 *
 * Feature factories live on secondary entries (`bulk-actions`, `filters`,
 * …); import them from those paths or from `@adapttable/angular-unstyled/features`.
 *
 * @packageDocumentation
 */
export { AdaptFilterChips } from "./components/activeFilterChips";
export { AdaptAutoFilterForm } from "./components/autoFilterForm";
export { AdaptBulkBar } from "./components/bulkActionBar";
export { AdaptColumnMenu } from "./components/columnMenu";
export { AdaptDesktopTable } from "./components/desktopTable";
export { AdaptEditableCell } from "./components/editableCell";
export { AdaptFilterDrawer, AdaptFiltersForm } from "./components/filterPanel";
export { AdaptFilterPopover } from "./components/filterPopover";
export { AdaptGroupingPanel } from "./components/groupingPanel";
export { type MenuPopover, menuPopover } from "./components/menuPopover";
export { AdaptMobileCards } from "./components/mobileCards";
export {
  OVERLAY_Z,
  placeOverlayBelowTrigger,
} from "./components/overlayPlacement";
export { AdaptPaginationFooter } from "./components/paginationFooter";
export { AdaptSavedViewsMenu } from "./components/savedViewsMenu";
export {
  AdaptDensityButton,
  AdaptExportButton,
  AdaptFullscreenButton,
} from "./components/toolbarExtras";
export {
  AdaptDataTable,
  type RowActionsCell,
  type TableView,
} from "./dataTable";
export type { FiltersMode, FiltersView } from "./tableFilters";
