/**
 * Public names behind the table's named panel features — find, shortcuts,
 * bars and panels, visual effects, pivot and cell content — that a binding
 * wires to its own components. Kept as a dedicated barrel so the main entry
 * stays grouped by concern.
 */

export type {
  BulkActionOutcome,
  BulkActionRunnerController,
  BulkActionRunnerOptions,
  BulkActionRunnerSnapshot,
  BulkBarModel,
  BulkBarSelection,
} from "./actions/bulkActionRunner";
export {
  bulkActionErrorMessage,
  bulkBarModel,
  createBulkActionRunner,
} from "./actions/bulkActionRunner";
export type {
  ParsedChord,
  Shortcut,
  ShortcutKeyEvent,
} from "./actions/shortcuts";
export {
  chordHasCommandModifier,
  chordMatches,
  createShortcutHandler,
  DEFAULT_SHORTCUTS,
  isTextEntryTarget,
  parseChord,
} from "./actions/shortcuts";
export type {
  ExportProgressAction,
  ExportProgressDownload,
  ExportProgressView,
} from "./export/exportProgressView";
export {
  exportProgressHeading,
  exportProgressView,
  focusExportTrigger,
} from "./export/exportProgressView";
export type {
  ChordKeyEvent,
  FindBarKeyEvent,
  FindBarKeyTarget,
  FindShortcutScope,
  FindShortcutScopeOptions,
} from "./find/findBar";
export {
  createFindShortcutScope,
  defaultFindMatchCount,
  FIND_CURRENT_MATCH_SELECTOR,
  findMatchCountText,
  findMatchRow,
  handleFindBarKey,
  isFindShortcut,
  scrollCurrentMatchIntoView,
} from "./find/findBar";
export type {
  SelectionStatPart,
  StatusBarItem,
  StatusBarItemsInput,
} from "./focus/statusBar";
export { selectionStatParts, statusBarItems } from "./focus/statusBar";
export {
  DEFAULT_DENSITY,
  requestDensityChange,
  resolveDensity,
} from "./layout/density";
export type {
  SidePanelKeyEvent,
  SidePanelModel,
  SidePanelModelPanel,
  SidePanelTabModel,
} from "./layout/sidePanelModel";
export {
  DEFAULT_SIDE_PANEL_ID_PREFIX,
  handleSidePanelBodyKey,
  handleSidePanelTabKey,
  sidePanelModel,
  sidePanelTabId,
  sidePanelTabIndex,
} from "./layout/sidePanelModel";
export type { StickyToolbarStyle } from "./layout/stickyToolbar";
export {
  measuredToolbarHeight,
  resolveStickyToolbar,
  stickyHeaderOffset,
  stickyToolbarStyle,
} from "./layout/stickyToolbar";
export { isElementShowing, shouldEscapeClose } from "./overlays/escapeClose";
export { focusWasDropped, restoreFocusSoon } from "./overlays/restoreFocus";
export type {
  SavedViewControlKey,
  SavedViewGlyph,
  SavedViewRenameController,
  SavedViewRenameSnapshot,
  SavedViewRowControlModel,
  SavedViewRowControlsInput,
} from "./url/savedViewsPanelModel";
export {
  createSavedViewRenameController,
  SAVED_VIEW_GLYPH_PATHS,
  savedViewRowControls,
} from "./url/savedViewsPanelModel";
