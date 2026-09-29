/**
 * `@adapttable/angular-unstyled` — the Angular table drawn with native HTML
 * and no styles of its own, over `@adapttable/angular`.
 *
 * @packageDocumentation
 */
export { AdaptGroupingPanel } from "./components/groupingPanel";
export { AdaptDataTable, type TableView } from "./dataTable";
export {
  batchEditing,
  bulkActions,
  cellNavigation,
  columnMenu,
  densityChooser,
  editing,
  exportCsv,
  filters,
  fullscreen,
  groupingPanel,
  headerFilters,
  rowActions,
  type RowActionsFeatureOptions,
  rowEditing,
  rowReorder,
  savedViews,
  virtualize,
} from "./features";
export type { FiltersMode, FiltersView } from "./tableFilters";
