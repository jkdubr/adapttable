import {
  cellHighlightStyle as neutralCellHighlightStyle,
  type CellSpanAppearance,
  groupIndentStyle as neutralGroupIndentStyle,
  mergedCellStyle as neutralMergedCellStyle,
  type PinLeads,
  pinnedDataCellStyle as neutralPinnedDataCellStyle,
  pinnedEdgeCellStyle as neutralPinnedEdgeCellStyle,
  type PinOffset,
  type PinSide,
} from "@adapttable/core/binding";
import type { CSSProperties } from "react";

/**
 * Kit-independent display helpers shared by every adapter's table chrome —
 * logical alignment, the sort-indicator glyph, sticky pinned-cell styles, and
 * the row-memo guard. They are `@adapttable/core`'s, so every binding paints
 * the same rules; this module re-exports them where React kits import them.
 */
export {
  type GroupRowKind,
  groupRowParts,
  isCurrentMatchCell,
  isMatchedCell,
  isSelectedCell,
  logicalAlign,
  type PinSide,
  resolveMobileLabel,
  shallowEqualByKeys,
  SHARED_DESKTOP_ROW_KEYS,
  sortArrow,
} from "@adapttable/core/binding";

/**
 * Pinned data-cell sticky style with an opaque `background` so scrolled columns
 * don't bleed through the pinned ones — `@adapttable/core`'s
 * `pinnedDataCellStyle` as a React style object.
 *
 * @public
 */
export const pinnedDataCellStyle: (
  pin: PinOffset | undefined,
  z: number,
  leads: PinLeads,
  bg: string
) => CSSProperties | undefined = neutralPinnedDataCellStyle;

/**
 * Sticky style for a non-data edge cell (expand chevron, selection, actions) —
 * `@adapttable/core`'s `pinnedEdgeCellStyle` as a React style object.
 *
 * @public
 */
export const pinnedEdgeCellStyle: (
  side: PinSide,
  active: boolean,
  z: number,
  bg: string,
  shift?: number
) => CSSProperties | undefined = neutralPinnedEdgeCellStyle;

/**
 * Spreadsheet merge paint: centered content and one fill across the span —
 * `@adapttable/core`'s `mergedCellStyle` as a React style object.
 *
 * @public
 */
export const mergedCellStyle: (
  colSpan: number,
  rowSpan: number,
  appearance?: CellSpanAppearance,
  fill?: "on" | "off"
) => CSSProperties | undefined = neutralMergedCellStyle;

/**
 * How far a nested group header sits in from the one above it —
 * `@adapttable/core`'s `groupIndentStyle` as a React style object.
 *
 * @public
 */
export const groupIndentStyle: (level: number) => CSSProperties =
  neutralGroupIndentStyle;

/**
 * A cell's background, given everything that might want to colour it.
 *
 * The kit supplies its selection fill and core supplies the find-match fills,
 * both overridable through `--adapttable-find-match` /
 * `--adapttable-find-match-current`. Each highlight also carries an outline so
 * the mark survives `forced-colors` and is never colour-only. The current
 * match wins over other matches, which win over the selection —
 * `@adapttable/core`'s `cellHighlightStyle` with React style objects.
 *
 * @param props - The props from `getCellProps` / `getCellPropsAt`, or nothing.
 * @param base - The kit's own cell style (pinning, alignment).
 * @param selected - The kit's fill for a selected cell.
 * @returns The merged style, or `base` when nothing highlights this cell.
 *
 * @public
 */
export const cellHighlightStyle: (
  props: Readonly<Record<string, unknown>> | undefined,
  base: CSSProperties | undefined,
  selected: CSSProperties
) => CSSProperties | undefined = neutralCellHighlightStyle;
