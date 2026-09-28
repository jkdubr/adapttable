/**
 * The compact per-column filter row's cells: which control a filter
 * definition gets, what each control offers, and what it writes back to the
 * filter bag.
 *
 * The row under the header reads the same definitions and bag as the filter
 * panel. Bindings draw each cell with their kit's Search, Select, range
 * inputs and multi-select menu over these models.
 */
import type { TableLabels } from "../types";
import { defaultFilterRegistry } from "./filterBuiltins";
import { type FilterDef, filterLabel, filterStateKeys } from "./filterDefs";
import { type FilterFormSource, listFilterValues } from "./filterFormModel";
import type { FilterTypeRegistry } from "./filterRegistry";
import type { RangeFieldWidget } from "./filterWidgets";

/**
 * Which compact control a header filter cell renders.
 *
 * @public
 */
export type HeaderFilterCellKind =
  "text" | "select" | "multi" | "boolean" | "range";

/**
 * The compact control for a definition, by its registry widget (or its
 * `type` when the registry does not know it). `undefined` for a type the
 * header row has no compact control for.
 *
 * @param def - The filter definition.
 * @param registry - The filter type registry.
 * @returns The control kind.
 *
 * @public
 */
export function headerFilterCellKind<TRow>(
  def: FilterDef<TRow>,
  registry: FilterTypeRegistry
): HeaderFilterCellKind | undefined {
  switch (registry.get(def.type)?.widget ?? def.type) {
    case "text":
      return "text";
    case "select":
      return "select";
    case "multiSelect":
    case "checklist":
      return "multi";
    case "boolean":
      return "boolean";
    case "numberRange":
    case "dateRange":
      return "range";
    default:
      return undefined;
  }
}

/**
 * Whether a header filter holds a value worth marking its column with.
 *
 * The emptiness rules are the whole point, and they are not obvious: a
 * cleared text field leaves `""`, a cleared multi-select leaves `[]`, and a
 * control nobody touched leaves `undefined`. None of those is a filter. A
 * funnel that lights up for one is worse than no funnel at all, because a
 * reader who trusts it goes looking for a filter that is not there.
 *
 * @param props - The definition, the source and, for custom types, the registry.
 * @returns True when any of the filter's keys holds a value.
 *
 * @public
 */
export function hasActiveHeaderFilter<TRow>(
  props: Readonly<{
    def: FilterDef<TRow>;
    source: FilterFormSource<TRow>;
    registry?: FilterTypeRegistry;
  }>
): boolean {
  return filterStateKeys(
    props.def,
    props.registry ?? defaultFilterRegistry
  ).some((key) => {
    const value = props.source.extra[key];
    if (value == null || value === "") return false;
    return !(Array.isArray(value) && value.length === 0);
  });
}

/**
 * One option in a header filter's select or multi menu.
 *
 * @public
 */
export interface HeaderFilterOption {
  /** Value written when chosen. */
  readonly value: string;
  /** Caption shown. */
  readonly label: string;
}

/**
 * A single-choice header select: "any" first, then the definition's options.
 *
 * @public
 */
export interface HeaderFilterSelectModel {
  /** Accessible name. */
  readonly label: string;
  /** The chosen value, `""` for any. */
  readonly value: string;
  /** The choices, "any" first. */
  readonly options: readonly HeaderFilterOption[];
  /** Write a choice; `""` clears the filter. */
  readonly write: (value: string) => void;
}

function writeList<TRow>(
  def: FilterDef<TRow>,
  source: Pick<FilterFormSource<TRow>, "setExtra">,
  values: readonly string[]
): void {
  source.setExtra(def.key, values.length > 0 ? [...values] : undefined);
}

/**
 * The model for a `select` header cell.
 *
 * @param def - The filter definition.
 * @param source - The filter-bag slice.
 * @param options - The definition's resolved options.
 * @param labels - Fully resolved labels.
 * @returns The select's model.
 *
 * @public
 */
export function headerFilterSelectModel<TRow>(
  def: FilterDef<TRow>,
  source: Pick<FilterFormSource<TRow>, "extra" | "setExtra">,
  options: readonly HeaderFilterOption[],
  labels: Required<TableLabels>
): HeaderFilterSelectModel {
  const selected = listFilterValues(source.extra[def.key]);
  return {
    label: filterLabel(def),
    value: selected[0] ?? "",
    options: [
      { value: "", label: labels.boolAny },
      ...options.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    write: (value) => writeList(def, source, value === "" ? [] : [value]),
  };
}

/**
 * A compact multi-select header menu.
 *
 * @public
 */
export interface HeaderFilterMultiModel {
  /** Accessible name. */
  readonly label: string;
  /** What the closed menu reads: any, the one choice, or a count. */
  readonly summary: string;
  /** Every choice. */
  readonly options: readonly HeaderFilterOption[];
  /** The checked values. */
  readonly selected: readonly string[];
  /** Check or uncheck one value. */
  readonly toggle: (value: string, checked: boolean) => void;
}

/**
 * The model for a `multiSelect` or `checklist` header cell.
 *
 * @param def - The filter definition.
 * @param source - The filter-bag slice.
 * @param options - The definition's resolved options.
 * @param labels - Fully resolved labels.
 * @returns The menu's model.
 *
 * @public
 */
export function headerFilterMultiModel<TRow>(
  def: FilterDef<TRow>,
  source: Pick<FilterFormSource<TRow>, "extra" | "setExtra">,
  options: readonly HeaderFilterOption[],
  labels: Required<TableLabels>
): HeaderFilterMultiModel {
  const selected = listFilterValues(source.extra[def.key]);
  let summary = labels.boolAny;
  if (selected.length === 1) {
    const first = options.find((option) => option.value === selected[0]);
    summary = first?.label ?? selected[0] ?? summary;
  }
  if (selected.length > 1) summary = labels.groupCount(selected.length);
  return {
    label: filterLabel(def),
    summary,
    options: options.map((option) => ({
      value: option.value,
      label: option.label,
    })),
    selected,
    toggle: (value, checked) =>
      writeList(
        def,
        source,
        checked
          ? [...selected, value]
          : selected.filter((item) => item !== value)
      ),
  };
}

/**
 * The any / true / false choices of a boolean header cell.
 *
 * @param labels - Fully resolved labels.
 * @returns The three options, any first.
 *
 * @public
 */
export function headerFilterBooleanOptions(
  labels: Required<TableLabels>
): readonly HeaderFilterOption[] {
  return [
    { value: "", label: labels.boolAny },
    { value: "true", label: labels.boolTrue },
    { value: "false", label: labels.boolFalse },
  ];
}

/**
 * A compact range header cell: one bound, or two for `between`.
 *
 * @public
 */
export interface HeaderFilterRangeModel {
  /** Whether the upper-bound input shows. */
  readonly showUpper: boolean;
  /** Write the single value or lower bound. */
  readonly writeLower: (value: string) => void;
  /** Write the upper bound. */
  readonly writeUpper: (value: string) => void;
}

/**
 * The model for a range header cell over its range widget. The compact
 * header has no operator picker, and an unset operator would wipe the value
 * on write, so a write without one uses `gte` — the same inference a lone
 * lower bound gets.
 *
 * @param widget - The range widget for the definition.
 * @returns The cell's model.
 *
 * @public
 */
export function headerFilterRangeModel(
  widget: Pick<RangeFieldWidget, "op" | "a" | "b" | "arity" | "write">
): HeaderFilterRangeModel {
  const op = widget.op ?? "gte";
  return {
    showUpper: widget.arity === "two",
    writeLower: (value) => widget.write(op, value, widget.b),
    writeUpper: (value) => widget.write(op, widget.a, value),
  };
}
