/**
 * Public names behind the table's named panel features — find, shortcuts,
 * bars and panels, visual effects, pivot and cell content — that a binding
 * wires to its own components. Kept as a dedicated barrel so the main entry
 * stays grouped by concern.
 */

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
