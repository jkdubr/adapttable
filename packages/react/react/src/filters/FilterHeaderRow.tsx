/**
 * Compact per-column filter row under the header. Structure only —
 * adapters pass the Search, Select, range inputs and multi menu the
 * end user clicks. Same defs and extra bag the panel uses (#282).
 */
import {
  defaultFilterRegistry,
  type FilterDef,
  filterDefForColumn,
  type FilterFormSource,
  type FilterTypeRegistry,
  headerFilterBooleanOptions,
  headerFilterCellKind,
  headerFilterMultiModel,
  headerFilterRangeModel,
  headerFilterSelectModel,
  renderRegisteredFilter,
  type TableLabels,
} from "@adapttable/core";
import type { CSSProperties, ReactElement, ReactNode } from "react";

import type { ColumnDef } from "../columnDef";
import { ColumnSpacer } from "../virtual/ColumnSpacer";
import {
  useBooleanFilterWidget,
  useRangeFilterWidget,
  useTextFilterWidget,
} from "./filterForm";
import { useFilterOptions } from "./useFilterOptions";

export type { FilterFormSource, FilterTypeRegistry };
export { filterDefForColumn, hasActiveHeaderFilter } from "@adapttable/core";

/**
 * Class hooks the unstyled adapter maps onto `DataTableClassNames`.
 *
 * @public
 */
export interface FilterHeaderClassNames {
  /** Class for the filter row. */
  filterHeaderRow?: string;
  /** Class for one filter cell. */
  filterHeaderCell?: string;
  /** Class for the control inside a filter cell. */
  filterHeaderInput?: string;
  /** Class for a filter cell's popover. */
  filterHeaderMenu?: string;
  /** Class shared with the ordinary header cells. */
  headerCell?: string;
  /** Class for the expansion column's header cell. */
  expandHeader?: string;
  /** Class for the reorder column's header cell. */
  reorderHeader?: string;
  /** Class for the selection column's header cell. */
  selectionHeader?: string;
  /** Class for the actions column's header cell. */
  actionsHeader?: string;
}

/**
 * Overlay a sticky `top` on a cell or pad style.
 *
 * @public
 */
export function headerFilterStickTop(
  sticky: boolean,
  base: CSSProperties | undefined,
  top: number,
  stickyExtras?: CSSProperties
): CSSProperties | undefined {
  if (!sticky) return base;
  return { ...stickyExtras, ...base, top };
}

/**
 * Props for an adapter `FilterHeaderRow` — no slots on the public API.
 *
 * @public
 */
export interface FilterHeaderRowProps<TRow> {
  /** When false the row does not render, even if defs exist. */
  readonly enabled?: boolean;
  /** Visible columns, so each filter lands under its own header. */
  readonly columns: readonly ColumnDef<TRow>[];
  /** Filter definitions to render. */
  readonly defs: readonly FilterDef<TRow>[];
  /** Reads and writes the active filter values. */
  readonly source: FilterFormSource<TRow>;
  /** Custom filter types, beyond the built-ins. */
  readonly registry?: FilterTypeRegistry;
  /** Resolved labels, every key filled. */
  readonly labels: Required<TableLabels>;
  /** Whether an expansion column is injected. */
  readonly expandable?: boolean;
  /** Whether a reorder column is injected. */
  readonly showReorder?: boolean;
  /** Whether a selection column is injected. */
  readonly selection?: boolean;
  /** Whether an actions column is injected. */
  readonly showActions?: boolean;
  /** Widths standing in for columns outside the window. */
  readonly columnSpacers?: { start: number; end: number };
  /** Width and sticky offsets for a column's filter cell. */
  readonly cellStyle?: (column: ColumnDef<TRow>) => CSSProperties | undefined;
  /** Edge a column is pinned to, absent when it floats. */
  readonly pinSide?: (key: string) => "start" | "end" | undefined;
  /** Style for the spacer cells at either end. */
  readonly padStyle?: CSSProperties;
  /** Present only when the row sticks, for styling hooks. */
  readonly stickyAttr?: true;
  /** Per-part classes for the row. */
  readonly classNames?: FilterHeaderClassNames;
}

/**
 * Props for an adapter `FilterHeaderControl` — no slots on the public API.
 *
 * @public
 */
export interface FilterHeaderControlProps<TRow> {
  /** The filter this control edits. */
  readonly def: FilterDef<TRow>;
  /** Reads and writes the active filter values. */
  readonly source: FilterFormSource<TRow>;
  /** Resolved labels, every key filled. */
  readonly labels: Required<TableLabels>;
  /** Class for the control. */
  readonly className?: string;
  /** Custom filter types, beyond the built-ins. */
  readonly registry?: FilterTypeRegistry;
  /**
   * Dismiss the overlay after a finished single-control write. Default off.
   * Wired from the table's `closeHeaderFilterOnSelect`.
   */
  readonly closeOnSelect?: boolean;
}

/**
 * One option in a header Select or multi menu.
 *
 * @public
 */
export interface FilterHeaderOption {
  /** Value stored when this option is chosen. */
  readonly value: string;
  /** Caption shown for the option. */
  readonly label: string;
}

/**
 * Kit search field a text header cell calls.
 *
 * @public
 */
export interface FilterHeaderSearchProps {
  /** Accessible name for the box. */
  readonly label: string;
  /** Placeholder text. */
  readonly placeholder: string;
  /** Current text. */
  readonly value: string;
  /** Class for the box. */
  readonly className?: string;
  /** Called with the new text on every keystroke. */
  readonly onChange: (value: string) => void;
}

/**
 * Kit Select a select/boolean header cell calls.
 *
 * @public
 */
export interface FilterHeaderSelectProps {
  /** Accessible name for the select. */
  readonly label: string;
  /** Currently chosen value. */
  readonly value: string;
  /** Choices to offer. */
  readonly options: readonly FilterHeaderOption[];
  /** Class for the select. */
  readonly className?: string;
  /** Called with the chosen value. */
  readonly onChange: (value: string) => void;
}

/**
 * Kit number/date field a range header cell calls.
 *
 * @public
 */
export interface FilterHeaderRangeProps {
  /** Accessible name for the field. */
  readonly label: string;
  /** Which input type the bound is edited with. */
  readonly type: "text" | "number" | "date";
  /** Current bound, as text. */
  readonly value: string;
  /** Called with the new bound. */
  readonly onChange: (value: string) => void;
}

/**
 * Kit compact multi menu a checklist/multiSelect header cell calls.
 *
 * @public
 */
export interface FilterHeaderMultiProps {
  /** Accessible name for the trigger. */
  readonly label: string;
  /** What the trigger shows for the current selection. */
  readonly summary: string;
  /** Choices to offer. */
  readonly options: readonly FilterHeaderOption[];
  /** Values currently checked. */
  readonly selected: readonly string[];
  /** Class for the trigger. */
  readonly className?: string;
  /** Class for the popover. */
  readonly menuClassName?: string;
  /** Called with a value and its new checked state. */
  readonly onToggle: (value: string, checked: boolean) => void;
}

/**
 * Adapter-supplied controls for {@link FilterHeaderChrome}.
 *
 * @public
 */
export interface FilterHeaderSlots {
  /** Renders a free-text filter. */
  readonly Search: (props: FilterHeaderSearchProps) => ReactNode;
  /** Renders a single-choice filter. */
  readonly Select: (props: FilterHeaderSelectProps) => ReactNode;
  /** Renders one bound of a range filter. */
  readonly Range: (props: FilterHeaderRangeProps) => ReactNode;
  /** Renders a multi-choice filter behind a popover. */
  readonly Multi: (props: FilterHeaderMultiProps) => ReactNode;
}

/**
 * Props for {@link FilterHeaderChrome}.
 *
 * @public
 */
export interface FilterHeaderChromeProps<
  TRow,
> extends FilterHeaderRowProps<TRow> {
  /** The kit's controls for each filter shape. */
  readonly slots: FilterHeaderSlots;
}

/**
 * Props for {@link FilterHeaderControlChrome}.
 *
 * @public
 */
export interface FilterHeaderControlChromeProps<
  TRow,
> extends FilterHeaderControlProps<TRow> {
  /** The kit's controls for each filter shape. */
  readonly slots: FilterHeaderSlots;
}

function Pad({
  part,
  style,
  stickyAttr,
  className,
}: Readonly<{
  part: string;
  style?: CSSProperties;
  stickyAttr?: true;
  className?: string;
}>): ReactElement {
  return (
    <td
      data-adapttable-part={part}
      data-sticky={stickyAttr}
      style={style}
      className={className}
    />
  );
}

function TextCell<TRow>({
  def,
  source,
  labels,
  className,
  slots,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
  slots: FilterHeaderSlots;
}>): ReactElement {
  const widget = useTextFilterWidget(def, source);
  const Search = slots.Search;
  return (
    <Search
      label={widget.label}
      placeholder={labels.search}
      value={widget.value}
      className={className}
      onChange={(value) => widget.write(widget.op, value)}
    />
  );
}

function SelectCell<TRow>({
  def,
  source,
  labels,
  className,
  slots,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
  slots: FilterHeaderSlots;
}>): ReactElement {
  const { options } = useFilterOptions(def);
  const model = headerFilterSelectModel(def, source, options, labels);
  const Select = slots.Select;
  return (
    <Select
      label={model.label}
      value={model.value}
      className={className}
      options={model.options}
      onChange={model.write}
    />
  );
}

function CompactMultiCell<TRow>({
  def,
  source,
  labels,
  className,
  menuClassName,
  slots,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
  menuClassName?: string;
  slots: FilterHeaderSlots;
}>): ReactElement {
  const { options } = useFilterOptions(def);
  const model = headerFilterMultiModel(def, source, options, labels);
  const Multi = slots.Multi;
  return (
    <Multi
      label={model.label}
      summary={model.summary}
      options={model.options}
      selected={model.selected}
      className={className}
      menuClassName={menuClassName}
      onToggle={model.toggle}
    />
  );
}

function BooleanCell<TRow>({
  def,
  source,
  labels,
  className,
  slots,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
  slots: FilterHeaderSlots;
}>): ReactElement {
  const widget = useBooleanFilterWidget(def, source);
  const Select = slots.Select;
  return (
    <Select
      label={widget.label}
      value={widget.choice}
      className={className}
      options={headerFilterBooleanOptions(labels)}
      onChange={(value) => widget.write(value as typeof widget.choice)}
    />
  );
}

function RangeCell<TRow>({
  def,
  source,
  className,
  slots,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  className?: string;
  slots: FilterHeaderSlots;
}>): ReactElement {
  const widget = useRangeFilterWidget(def, source);
  const model = headerFilterRangeModel(widget);
  const Range = slots.Range;
  return (
    <span data-adapttable-part="filter-header-input" className={className}>
      <Range
        label={widget.label}
        type={widget.inputType}
        value={widget.a}
        onChange={model.writeLower}
      />
      {model.showUpper ? (
        <Range
          label={widget.label}
          type={widget.inputType}
          value={widget.b}
          onChange={model.writeUpper}
        />
      ) : null}
    </span>
  );
}

function FilterHeaderCell<TRow>({
  def,
  source,
  labels,
  className,
  menuClassName,
  registry = defaultFilterRegistry,
  slots,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
  menuClassName?: string;
  registry?: FilterTypeRegistry;
  slots: FilterHeaderSlots;
}>): ReactElement | null {
  const custom = renderRegisteredFilter(
    def,
    source,
    labels,
    registry,
    className
  );
  if (custom) return custom as ReactElement;
  switch (headerFilterCellKind(def, registry)) {
    case "text":
      return (
        <TextCell
          def={def}
          source={source}
          labels={labels}
          className={className}
          slots={slots}
        />
      );
    case "select":
      return (
        <SelectCell
          def={def}
          source={source}
          labels={labels}
          className={className}
          slots={slots}
        />
      );
    case "multi":
      return (
        <CompactMultiCell
          def={def}
          source={source}
          labels={labels}
          className={className}
          menuClassName={menuClassName}
          slots={slots}
        />
      );
    case "boolean":
      return (
        <BooleanCell
          def={def}
          source={source}
          labels={labels}
          className={className}
          slots={slots}
        />
      );
    case "range":
      return (
        <RangeCell
          def={def}
          source={source}
          className={className}
          slots={slots}
        />
      );
    case undefined:
      return null;
  }
}

/**
 * Compact control for one filter definition — used in the header row and antd titles.
 *
 * @public
 */
export function FilterHeaderControlChrome<TRow>({
  def,
  source,
  labels,
  className,
  registry = defaultFilterRegistry,
  slots,
}: Readonly<FilterHeaderControlChromeProps<TRow>>): ReactElement {
  return (
    <FilterHeaderCell
      def={def}
      source={source}
      labels={labels}
      className={className}
      registry={registry}
      slots={slots}
    />
  );
}

/**
 * Second header row of per-column quick filters. Pads and spacers match
 * the leaf header so sticky, pin offsets, and column windowing stay aligned.
 *
 * @public
 */
export function FilterHeaderChrome<TRow>({
  enabled = true,
  columns,
  defs,
  source,
  labels,
  expandable = false,
  showReorder = false,
  selection = false,
  showActions = false,
  columnSpacers,
  cellStyle,
  pinSide,
  padStyle,
  stickyAttr,
  classNames = {},
  registry = defaultFilterRegistry,
  slots,
}: Readonly<FilterHeaderChromeProps<TRow>>): ReactElement | null {
  if (!enabled || defs.length === 0) return null;
  const pad = (part: string, extra?: string) => (
    <Pad
      part={part}
      style={padStyle}
      stickyAttr={stickyAttr}
      className={[classNames.headerCell, extra].filter(Boolean).join(" ")}
    />
  );
  return (
    <tr
      data-adapttable-part="filter-header-row"
      className={classNames.filterHeaderRow}
      aria-label={labels.headerFilters}
    >
      {expandable ? pad("expand-header", classNames.expandHeader) : null}
      {showReorder ? pad("reorder-header", classNames.reorderHeader) : null}
      {selection ? pad("selection-header", classNames.selectionHeader) : null}
      {columnSpacers ? (
        <ColumnSpacer width={columnSpacers.start} side="start" as="th" />
      ) : null}
      {columns.map((column) => {
        const def = filterDefForColumn(defs, column.key);
        return (
          <th
            key={column.key}
            data-adapttable-part="filter-header-cell"
            data-sticky={stickyAttr}
            data-pinned={pinSide?.(column.key)}
            style={cellStyle?.(column)}
            className={
              [classNames.headerCell, classNames.filterHeaderCell]
                .filter(Boolean)
                .join(" ") || undefined
            }
            data-column-key={column.key}
          >
            {def ? (
              <FilterHeaderCell
                def={def}
                source={source}
                labels={labels}
                className={classNames.filterHeaderInput}
                menuClassName={classNames.filterHeaderMenu}
                registry={registry}
                slots={slots}
              />
            ) : null}
          </th>
        );
      })}
      {columnSpacers ? (
        <ColumnSpacer width={columnSpacers.end} side="end" as="th" />
      ) : null}
      {showActions ? pad("actions-header", classNames.actionsHeader) : null}
    </tr>
  );
}
