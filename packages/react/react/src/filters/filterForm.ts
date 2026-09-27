import {
  type BooleanFieldWidget,
  booleanFilterWidget,
  type FilterDef,
  type FilterFormSource,
  type FilterTypeRegistry,
  initialRangeFilterOp,
  initialTextFilterOp,
  type RangeFieldWidget,
  rangeFilterWidget,
  type RangeOp,
  type TableLabels,
  type TableSource,
  type TextFieldWidget,
  textFilterWidget,
  type TextOp,
} from "@adapttable/core";
import { useState } from "react";

export type {
  BooleanChoice,
  BooleanFieldWidget,
  DateOp,
  FilterFormSource,
  NumberOp,
  RangeFieldWidget,
  RangeOpArity,
  RangeOpLabelKeys,
  TextFieldWidget,
  TextOp,
} from "@adapttable/core";
export {
  filterOpLabel,
  listFilterValues,
  parseBooleanChoice,
  scalarFilterText,
} from "@adapttable/core";

/**
 * What the filters panel (tree builder + optional simple fields) needs.
 *
 * The table asks through a feature slot so the kit form stays behind
 * `@adapttable/<kit>/filters` instead of the adapter root.
 *
 * @public
 */
export interface FiltersFormSlotProps<TRow> {
  /** Resolved declarative definitions, in render order. */
  readonly defs: readonly FilterDef<TRow>[];
  /** Source the tree and the simple fields read and write. */
  readonly source: TableSource<TRow>;
  /** Type registry; kits pass it through to both surfaces. */
  readonly registry: FilterTypeRegistry;
  /** Fully resolved labels for every control. */
  readonly labels: Required<TableLabels>;
  /** Open Advanced on first paint. */
  readonly defaultExpanded?: boolean;
  /** When true, also draw the simple AutoFilterForm fields. */
  readonly showSimpleFields: boolean;
}

/**
 * The shared, kit-agnostic logic behind an auto-built range filter
 * (`numberRange` / `dateRange`): it seeds the operator from the persisted
 * `Op` token (or infers it from the Min/Max pair), derives the visible
 * bound(s), and writes interactions back so the operator survives the URL.
 *
 * @typeParam TRow - The row type.
 * @param def - The range filter definition.
 * @param source - The filter-bag slice (extra + setters).
 * @returns The {@link RangeFieldWidget} state and writers.
 *
 * @public
 */
export function useRangeFilterWidget<TRow>(
  def: FilterDef<TRow>,
  source: FilterFormSource<TRow>
): RangeFieldWidget {
  const [op, setOp] = useState<RangeOp | undefined>(() =>
    initialRangeFilterOp(def, source.extra)
  );
  return { ...rangeFilterWidget(def, source, op), setOp };
}

/**
 * Kit-agnostic logic for a `text` filter: operator-first, persisted as
 * `f_<key>` plus `f_<key>Op` so the comparison survives the URL.
 *
 * @typeParam TRow - The row type.
 * @param def - The text filter definition.
 * @param source - The filter-bag slice (extra + setters).
 * @returns The {@link TextFieldWidget} state and writers.
 *
 * @public
 */
export function useTextFilterWidget<TRow>(
  def: FilterDef<TRow>,
  source: FilterFormSource<TRow>
): TextFieldWidget {
  const [localOp, setLocalOp] = useState<TextOp>(() =>
    initialTextFilterOp(def, source.extra)
  );
  return textFilterWidget(def, source, localOp, setLocalOp);
}

/**
 * Kit-agnostic logic for a `boolean` filter: any / true / false, never a
 * checkbox. The token is stored as `f_<key>=true|false`; omitting it is any.
 *
 * @public
 */
export function useBooleanFilterWidget<TRow>(
  def: FilterDef<TRow>,
  source: FilterFormSource<TRow>
): BooleanFieldWidget {
  return booleanFilterWidget(def, source);
}
