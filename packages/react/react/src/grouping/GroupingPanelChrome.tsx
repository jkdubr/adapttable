/**
 * Adapter-neutral structure for the interactive grouping strip.
 *
 * Every visible control is a required slot. Core owns ordering, state
 * transitions, part names, and the invisible live region only.
 */
import {
  type AggregationItem,
  type GroupingChipKeyboardProps as CoreGroupingChipKeyboardProps,
  type GroupingDragProps as CoreGroupingDragProps,
  type GroupingDropProps as CoreGroupingDropProps,
  type ResolvedAggregateOperation,
  type TableLabels,
} from "@adapttable/core";
import type {
  GroupingChipKeyboardProps as NeutralGroupingChipKeyboardProps,
  GroupingDragProps as NeutralGroupingDragProps,
  GroupingDropProps as NeutralGroupingDropProps,
  GroupingPanelAggregationItemProps as NeutralGroupingPanelAggregationItemProps,
  GroupingPanelChipProps as NeutralGroupingPanelChipProps,
  GroupingPanelDropZoneProps as NeutralGroupingPanelDropZoneProps,
  GroupingPanelRemoveZoneProps as NeutralGroupingPanelRemoveZoneProps,
  GroupingPanelSlotProps as NeutralGroupingPanelSlotProps,
  GroupingPanelSlots as NeutralGroupingPanelSlots,
  GroupingPanelSurfaceProps as NeutralGroupingPanelSurfaceProps,
} from "@adapttable/core/binding";
import {
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

import { LiveRegion } from "../a11y/LiveRegion";
import type { ColumnDef } from "../columnDef";

export type {
  GroupingPanelAggregationRemoveProps,
  GroupingPanelChecklistOption,
  GroupingPanelChecklistProps,
  GroupingPanelOption,
  GroupingPanelRestoreProps,
  GroupingPanelSelectProps,
} from "@adapttable/core/binding";

/**
 * React-compatible drag props for grouping chips and headers —
 * `@adapttable/core`'s `GroupingDragProps` with React's drag event.
 *
 * @public
 */
export type GroupingDragProps = NeutralGroupingDragProps<DragEvent>;

/**
 * React-compatible drop-target props for the grouping strip —
 * `@adapttable/core`'s `GroupingDropProps` with React's drag event.
 *
 * @public
 */
export type GroupingDropProps = NeutralGroupingDropProps<DragEvent>;

/**
 * React-compatible keyboard props for a grouping chip handle —
 * `@adapttable/core`'s `GroupingChipKeyboardProps` with React's key event.
 *
 * @public
 */
export type GroupingChipKeyboardProps =
  NeutralGroupingChipKeyboardProps<KeyboardEvent>;

function reactGroupingDragProps(
  props: CoreGroupingDragProps
): GroupingDragProps {
  return props as unknown as GroupingDragProps;
}

/**
 * Drop handlers that refuse.
 *
 * Nothing calls `preventDefault`, so the browser shows the reader this is not
 * a place to let go — and the event stops here rather than reaching the chip
 * or the strip around it, both of which would have taken it. A refusal that
 * bubbles is not a refusal.
 */
const INERT_DROP_PROPS: GroupingDropProps = {
  onDragEnter: (event) => event.stopPropagation(),
  onDragOver: (event) => event.stopPropagation(),
  onDragLeave: (event) => event.stopPropagation(),
  onDrop: (event) => event.stopPropagation(),
};

function reactGroupingDropProps(
  props: CoreGroupingDropProps
): GroupingDropProps {
  return props as unknown as GroupingDropProps;
}

/**
 * Drop handlers that stand down for whatever inside them already answered.
 *
 * The strip nests targets — a caret inside a chip, a chip inside the panel —
 * and the innermost one is always the more precise answer. It says so by
 * calling `preventDefault`, which is how the browser is told a drop is
 * accepted here; anything wrapping it reads that and keeps out of the way.
 */
function deferToInner(props: CoreGroupingDropProps): CoreGroupingDropProps {
  const passUp =
    <TEvent extends { defaultPrevented: boolean }>(
      handler: ((event: TEvent) => void) | undefined
    ) =>
    (event: TEvent) => {
      if (event.defaultPrevented) return;
      handler?.(event);
    };
  return {
    onDragEnter: passUp(props.onDragEnter),
    onDragOver: passUp(props.onDragOver),
    onDragLeave: props.onDragLeave,
    onDrop: passUp(props.onDrop),
  };
}

function reactGroupingChipKeyboardProps(
  props: CoreGroupingChipKeyboardProps
): GroupingChipKeyboardProps {
  return props as unknown as GroupingChipKeyboardProps;
}

/**
 * Props for the kit-owned grouping panel surface — `@adapttable/core`'s
 * `GroupingPanelSurfaceProps` with React content and drag events.
 *
 * @public
 */
export type GroupingPanelSurfaceProps = NeutralGroupingPanelSurfaceProps<
  ReactNode,
  DragEvent
>;

/**
 * Props for one kit-owned insertion target — `@adapttable/core`'s
 * `GroupingPanelDropZoneProps` with React's drag event.
 *
 * @public
 */
export type GroupingPanelDropZoneProps =
  NeutralGroupingPanelDropZoneProps<DragEvent>;

/**
 * Props for one kit-owned active grouping chip — `@adapttable/core`'s
 * `GroupingPanelChipProps` with React's key and drag events.
 *
 * @public
 */
export type GroupingPanelChipProps = NeutralGroupingPanelChipProps<
  KeyboardEvent,
  DragEvent
>;

/**
 * Props for one kit-owned active aggregation — `@adapttable/core`'s
 * `GroupingPanelAggregationItemProps` with React content.
 *
 * @public
 */
export type GroupingPanelAggregationItemProps =
  NeutralGroupingPanelAggregationItemProps<ReactNode>;

/**
 * Props for the chip-only drop target that ungroups a field —
 * `@adapttable/core`'s `GroupingPanelRemoveZoneProps` with React's drag event.
 *
 * @public
 */
export type GroupingPanelRemoveZoneProps =
  NeutralGroupingPanelRemoveZoneProps<DragEvent>;

/**
 * Kit-native visible pieces required by the grouping panel —
 * `@adapttable/core`'s `GroupingPanelSlots` drawing React nodes with React's
 * key and drag events.
 *
 * @public
 */
export type GroupingPanelSlots = NeutralGroupingPanelSlots<
  ReactNode,
  KeyboardEvent,
  DragEvent
>;

/**
 * State and table context supplied to an adapter's grouping-panel slot —
 * `@adapttable/core`'s `GroupingPanelSlotProps` over React column
 * definitions.
 *
 * @public
 */
export type GroupingPanelSlotProps<TRow = unknown> =
  NeutralGroupingPanelSlotProps<ColumnDef<TRow>>;

/** Full props for {@link GroupingPanelChrome}. @public */
export interface GroupingPanelChromeProps<
  TRow = unknown,
> extends GroupingPanelSlotProps<TRow> {
  /** Kit-owned controls used for every visible element. */
  slots: GroupingPanelSlots;
}

function columnName<TRow>(column: ColumnDef<TRow>): string {
  if (typeof column.header === "string") return column.header;
  return column.mobileLabel ?? column.key;
}

function firstFocusable(
  root: ParentNode | null,
  selector: string
): HTMLElement | null {
  const node = root?.querySelector(selector);
  return node instanceof HTMLElement ? node : null;
}

/**
 * After an item's remove control unmounts, put focus on the next remaining
 * remove — or the add-columns checklist, so keyboard users are not dumped
 * onto the document body.
 */
function focusAfterAggregationRemoval(
  root: HTMLElement | null,
  remainingKeys: readonly string[],
  removedIndex: number
): void {
  const nextKey =
    remainingKeys[removedIndex] ?? remainingKeys[removedIndex - 1];
  if (nextKey) {
    const next = firstFocusable(
      root,
      `[data-adapttable-aggregation="${CSS.escape(nextKey)}"] [data-adapttable-part="grouping-aggregation-remove"]`
    );
    if (next) {
      next.focus();
      return;
    }
  }
  const option = firstFocusable(
    root,
    `[data-adapttable-part="grouping-aggregation-option"]`
  );
  if (option) {
    option.focus();
    return;
  }
  firstFocusable(
    root,
    `[data-adapttable-part="grouping-aggregation-add"], [data-adapttable-part="grouping-aggregations-restore"]`
  )?.focus();
}

/**
 * What one operation is called.
 *
 * The table localizes its own five; an operation a column declared itself
 * carries the label the host wrote, which no locale file can know.
 */
function operationLabel(
  operation: ResolvedAggregateOperation,
  labels: Required<TableLabels>
): string {
  if (!operation.builtIn) return operation.label ?? operation.id;
  const named: Partial<Record<string, string>> = {
    sum: labels.selectionSum,
    avg: labels.groupingAverage,
    min: labels.selectionMin,
    max: labels.selectionMax,
    count: labels.selectionCount,
  };
  return named[operation.id] ?? operation.id;
}

/** Options for one item, including an honest Custom current value. */
function aggregationSelectOptions(
  item: AggregationItem,
  labels: Required<TableLabels>
): { value: string; label: string }[] {
  const options = item.operations.map((operation) => ({
    value: operation.id,
    label: operationLabel(operation, labels),
  }));
  if (item.operationId === undefined) {
    options.unshift({
      value: "",
      label: labels.groupingAggregationCustom,
    });
  } else if (!options.some((option) => option.value === item.operationId)) {
    options.unshift({
      value: item.operationId,
      label: operationLabel({ id: item.operationId, builtIn: true }, labels),
    });
  }
  return options;
}

/**
 * Render a kit-native, keyboard-complete interactive grouping strip.
 *
 * @public
 */
export function GroupingPanelChrome<TRow>({
  state,
  columns,
  labels,
  mobile,
  dir,
  slots,
}: Readonly<GroupingPanelChromeProps<TRow>>): ReactNode {
  const {
    Surface,
    DropZone,
    Chip,
    Select,
    RemoveZone,
    AggregationItem,
    AggregationRemove,
    AggregationPicker,
    AggregationRestore,
  } = slots;
  const byKey = new Map(columns.map((column) => [column.key, column]));
  const available = columns
    .filter(
      (column) =>
        column.groupable !== false && !state.groupBy.includes(column.key)
    )
    .map((column) => ({ value: column.key, label: columnName(column) }));
  /** A column's display name, or its key for a cell only the app declared. */
  const nameOf = (key: string): string => {
    const column = byKey.get(key);
    return column ? columnName(column) : key;
  };
  const items = state.aggregations.items;
  const aggregationsRef = useRef<HTMLFieldSetElement>(null);
  const pendingRemovalIndex = useRef<number | null>(null);
  const itemKeys = items.map((item) => item.columnKey).join("\0");
  useEffect(() => {
    const removedIndex = pendingRemovalIndex.current;
    if (removedIndex === null) return;
    pendingRemovalIndex.current = null;
    focusAfterAggregationRemoval(
      aggregationsRef.current,
      items.map((item) => item.columnKey),
      removedIndex
    );
  }, [itemKeys, items]);
  // Grouping and aggregation are independent: a grouped column may still
  // carry a Count (or any other allowed operation). The group's row count
  // is not a substitute — missing values make those different.
  const offered = state.aggregations.candidates;

  // A chip dropped either side of itself lands exactly where it already is.
  // Those boundaries are the two nearest the reader's hand, so offering them
  // is offering a target that does nothing — which reads as the drag failing.
  const lifted =
    state.drag?.source === "chip" ? state.groupBy.indexOf(state.drag.key) : -1;
  const inert = (index: number) =>
    lifted >= 0 && (index === lifted || index === lifted + 1);
  // A chip is a target too, and the nearest one to the reader's hand: dropping
  // onto a chip takes that chip's place. Insertion boundaries alone put every
  // meaningful target a chip's width away from where the drag began — pick up
  // the last field and the only places that would move it are back at the head
  // of the strip.
  const ontoChip = (index: number): CoreGroupingDropProps => {
    const target = lifted >= 0 && lifted < index ? index + 1 : index;
    // The chip being dragged is not a place to drop it.
    if (lifted >= 0 && target === lifted) {
      return INERT_DROP_PROPS as unknown as CoreGroupingDropProps;
    }
    return deferToInner(state.dropProps(target));
  };
  // The strip is mostly free space, and free space is where a hand carrying a
  // header lets go. A drop there lands at the end — unless a caret or a chip
  // inside it already answered something more precise.
  const ontoPanel = (): CoreGroupingDropProps => {
    const target = state.groupBy.length;
    if (inert(target)) return {};
    return deferToInner(state.dropProps(target));
  };

  const boundary = (index: number) =>
    inert(index)
      ? {
          dragging: false,
          active: false,
          dropProps: INERT_DROP_PROPS,
        }
      : {
          dragging: state.drag !== undefined,
          active: state.drag?.overIndex === index,
          dropProps: reactGroupingDropProps(state.dropProps(index)),
        };

  return (
    <Surface
      label={labels.groupingPanel}
      mobile={mobile}
      dir={dir}
      {...(mobile ? {} : reactGroupingDropProps(ontoPanel()))}
      data-adapttable-part="grouping-panel"
    >
      {state.groupBy.map((key, index) => {
        const label = byKey.has(key) ? columnName(byKey.get(key)!) : key;
        return (
          // Each boundary is drawn WITH the chip it sits before, inside one
          // inline-flex row. Drawn beside the chips instead, the boundary
          // before the first one floated off on its own — and dropping there
          // is the only way to group by a new field FIRST.
          <span
            key={key}
            data-adapttable-part="grouping-item"
            style={{ display: "inline-flex", alignItems: "center" }}
            {...(mobile ? {} : reactGroupingDropProps(ontoChip(index)))}
          >
            {!mobile ? (
              <DropZone
                label={labels.groupingDropColumns}
                empty={false}
                {...boundary(index)}
                data-adapttable-part="grouping-drop-zone"
              />
            ) : null}
            <Chip
              label={label}
              level={index + 1}
              dragProps={reactGroupingDragProps(state.chipDragProps(key))}
              keyboardProps={reactGroupingChipKeyboardProps(
                state.chipKeyboardProps(key, label)
              )}
              onRemove={() => state.remove(key)}
              removeLabel={labels.removeGroupingColumn(label)}
              data-adapttable-part="grouping-chip"
            />
            {!mobile && index === state.groupBy.length - 1 ? (
              <DropZone
                label={labels.groupingDropColumns}
                empty={false}
                {...boundary(index + 1)}
                data-adapttable-part="grouping-drop-zone"
              />
            ) : null}
          </span>
        );
      })}
      {!mobile && state.groupBy.length === 0 ? (
        <DropZone
          label={labels.groupingDropColumns}
          empty
          dragging={state.drag !== undefined}
          active={state.drag?.overIndex === 0}
          dropProps={reactGroupingDropProps(state.dropProps(0))}
          data-adapttable-part="grouping-drop-zone"
        />
      ) : null}
      <Select
        label={labels.addGroupingColumn}
        value=""
        options={available}
        onChange={state.add}
        disabled={available.length === 0}
        data-adapttable-part="grouping-add"
      />
      {/* Aggregations own the line under the grouping chips — never mixed
          onto the chip row, even when the strip still has room. */}
      {state.groupBy.length > 0 && (items.length > 0 || offered.length > 0) ? (
        <fieldset
          ref={aggregationsRef}
          aria-label={labels.groupingAggregations}
          data-adapttable-part="grouping-aggregations"
          style={{
            display: "flex",
            flex: "1 0 100%",
            width: "100%",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem",
            minWidth: 0,
            minInlineSize: 0,
            margin: 0,
            padding: 0,
            border: "none",
          }}
        >
          {items.map((item) => {
            const name = nameOf(item.columnKey);
            return (
              <span
                key={item.columnKey}
                data-adapttable-aggregation={item.columnKey}
              >
                <AggregationItem
                  label={name}
                  readOnly={!item.editable}
                  readOnlyLabel={labels.groupingAggregationReadOnly}
                  data-adapttable-part="grouping-aggregation-item"
                >
                  {item.editable ? (
                    <>
                      <Select
                        label={labels.groupingAggregationFor(name)}
                        value={item.operationId ?? ""}
                        options={aggregationSelectOptions(item, labels)}
                        onChange={(value) => {
                          if (value === "") return;
                          state.setAggregateOperation(item.columnKey, value);
                        }}
                        disabled={!state.canSetAggregates}
                        data-adapttable-part="grouping-aggregation-operation"
                      />
                      <AggregationRemove
                        label={labels.groupingRemoveAggregation(name)}
                        onRemove={() => {
                          pendingRemovalIndex.current = items.findIndex(
                            (entry) => entry.columnKey === item.columnKey
                          );
                          state.removeAggregate(item.columnKey);
                        }}
                        data-adapttable-part="grouping-aggregation-remove"
                      />
                    </>
                  ) : null}
                </AggregationItem>
              </span>
            );
          })}
          <AggregationPicker
            label={labels.groupingAddAggregation}
            options={offered.map((candidate) => ({
              value: candidate.columnKey,
              label: nameOf(candidate.columnKey),
              checked: candidate.active,
            }))}
            onToggle={(value, checked) => {
              if (checked) {
                state.addAggregate(value);
                return;
              }
              pendingRemovalIndex.current = items.findIndex(
                (entry) => entry.columnKey === value
              );
              state.removeAggregate(value);
            }}
            disabled={!state.canSetAggregates || offered.length === 0}
            data-adapttable-part="grouping-aggregation-add"
          />
          {state.aggregations.hasDefaults && !state.aggregations.atDefaults ? (
            <AggregationRestore
              label={labels.groupingRestoreAggregations}
              disabled={!state.canSetAggregates}
              onRestore={state.restoreAggregateDefaults}
              data-adapttable-part="grouping-aggregations-restore"
            />
          ) : null}
        </fieldset>
      ) : null}
      <LiveRegion part="grouping-announcer" statusRole={false}>
        {state.announcement}
      </LiveRegion>
      {/* The way out of a grouping, on a line of its own: a target squeezed in
          beside the chips is one a reader never finds. It exists only while a
          chip is in the air, so it takes the line BELOW them — a line that
          appears above the chips moves the one under the pointer, and a drag
          whose source is pulled away the instant it starts never begins. */}
      {state.drag?.source === "chip" ? (
        <span style={{ display: "flex", flex: "1 0 100%", width: "100%" }}>
          <RemoveZone
            label={labels.groupingDropToRemove}
            active={state.drag.overRemove === true}
            dropProps={reactGroupingDropProps(state.removeDropProps())}
            data-adapttable-part="grouping-remove-zone"
          />
        </span>
      ) : null}
    </Surface>
  );
}
