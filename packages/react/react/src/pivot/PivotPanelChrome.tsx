/**
 * The pivot configuration panel: three lists, and a way to move fields
 * between them.
 *
 * Every pivot UI in every spreadsheet is drag-and-drop, and every one of them
 * is unusable without a mouse. Dragging is a fine way to express "put Team
 * above Region" and a terrible way to be the *only* way — so the panel is
 * built keyboard-first: each field carries buttons that move it, and the
 * result is a control anyone can drive with Tab and Enter. A kit that wants
 * dragging can add it on top; nothing here forbids it, and nothing here
 * depends on it.
 *
 * Structure, part names, ordering and labels live here. Every visible control
 * — the buttons, the selects, the surfaces they sit on — is a required slot
 * the adapter fills with its own kit's component, so a Mantine panel is built
 * from Mantine buttons and an antd panel from antd buttons.
 */
import {
  type AggregateName,
  assignField,
  availableFields,
  measureLabel,
  moveField,
  type PivotConfig,
  type PivotField,
  type PivotZone,
  removeField,
  resolveLabels,
  setMeasureAgg,
  type TableLabels,
} from "@adapttable/core";
import type {
  PivotFieldProps as NeutralPivotFieldProps,
  PivotPanelChromeProps as NeutralPivotPanelChromeProps,
  PivotPanelSlots as NeutralPivotPanelSlots,
  PivotPanelSurfaceProps as NeutralPivotPanelSurfaceProps,
  PivotZoneProps as NeutralPivotZoneProps,
} from "@adapttable/core/binding";
import type { ReactNode } from "react";

export type { AggregateName, PivotConfig, PivotField, PivotZone };

/** The aggregations the panel offers. */
const AGGREGATIONS: readonly AggregateName[] = [
  "sum",
  "avg",
  "count",
  "min",
  "max",
];

export type { PivotAddProps, PivotAggProps } from "@adapttable/core/binding";

/**
 * Props an adapter's panel surface receives — `@adapttable/core`'s
 * `PivotPanelSurfaceProps` drawing React nodes.
 *
 * @public
 */
export type PivotPanelSurfaceProps = NeutralPivotPanelSurfaceProps<ReactNode>;

/**
 * Props an adapter's zone receives — `@adapttable/core`'s `PivotZoneProps`
 * drawing React nodes.
 *
 * @public
 */
export type PivotZoneProps = NeutralPivotZoneProps<ReactNode>;

/**
 * Props an adapter's field row receives — `@adapttable/core`'s
 * `PivotFieldProps` drawing React nodes.
 *
 * @public
 */
export type PivotFieldProps = NeutralPivotFieldProps<ReactNode>;

/**
 * The kit-native pieces the panel is built from — `@adapttable/core`'s
 * `PivotPanelSlots` drawing React nodes.
 *
 * @public
 */
export type PivotPanelSlots = NeutralPivotPanelSlots<ReactNode>;

/**
 * What the panel needs to render — `@adapttable/core`'s
 * `PivotPanelChromeProps` with React's slots.
 *
 * @public
 */
export type PivotPanelChromeProps = NeutralPivotPanelChromeProps<ReactNode>;

/** The caption for one zone. */
function zoneLabel(zone: PivotZone, labels: Required<TableLabels>): string {
  if (zone === "rows") return labels.pivotRows;
  if (zone === "columns") return labels.pivotColumns;
  return labels.pivotMeasures;
}

/**
 * The pivot configuration panel.
 *
 * @param props - Fields, the configuration, a change handler and the slots.
 * @returns The panel, built from the adapter's own controls.
 *
 * @public
 */
export function PivotPanelChrome({
  fields,
  config,
  onChange,
  labels: labelsProp,
  slots,
  className,
}: Readonly<PivotPanelChromeProps>) {
  const labels = resolveLabels(labelsProp);
  const { Surface, Zone, Field, Add, Agg } = slots;
  const unused = availableFields(fields, config);
  const nameOf = (key: string) =>
    fields.find((field) => field.key === key)?.label ?? key;

  const entriesFor = (zone: PivotZone): { key: string; label: string }[] =>
    zone === "measures"
      ? config.measures.map((measure, index) => ({
          key: `${measure.key}-${String(index)}`,
          label: measureLabel(measure, fields),
        }))
      : config[zone].map((key) => ({ key, label: nameOf(key) }));

  return (
    <Surface className={className} data-adapttable-part="pivot-panel">
      {(["rows", "columns", "measures"] as const).map((zone) => {
        const entries = entriesFor(zone);
        return (
          <Zone
            key={zone}
            zone={zone}
            label={zoneLabel(zone, labels)}
            data-adapttable-part="pivot-zone"
          >
            {entries.map((entry, index) => (
              <Field
                key={entry.key}
                label={entry.label}
                data-adapttable-part="pivot-field"
                moveUpLabel={labels.pivotMoveUp}
                moveDownLabel={labels.pivotMoveDown}
                removeLabel={labels.pivotRemove}
                onMoveUp={
                  index > 0
                    ? () => {
                        onChange(moveField(config, zone, index, -1));
                      }
                    : undefined
                }
                onMoveDown={
                  index < entries.length - 1
                    ? () => {
                        onChange(moveField(config, zone, index, 1));
                      }
                    : undefined
                }
                onRemove={() => {
                  onChange(removeField(config, zone, index));
                }}
                aggregation={
                  zone === "measures" ? (
                    <Agg
                      label={labels.pivotAggregation}
                      value={aggNameAt(config, index)}
                      options={AGGREGATIONS}
                      onChange={(next) => {
                        onChange(setMeasureAgg(config, index, next));
                      }}
                    />
                  ) : undefined
                }
              />
            ))}
            <Add
              label={labels.pivotAdd}
              // Measures may repeat a column; dimensions may not, so the
              // list of what can still be added differs per zone.
              options={zone === "measures" ? fields : unused}
              onAdd={(key) => {
                onChange(assignField(config, key, zone));
              }}
            />
          </Zone>
        );
      })}
    </Surface>
  );
}

function isAggName(value: string): value is AggregateName {
  return (AGGREGATIONS as readonly string[]).includes(value);
}

/** The aggregation shown for a measure, or `sum` for a custom one. */
function aggNameAt(config: PivotConfig, index: number): AggregateName {
  const agg = config.measures[index]?.agg;
  return typeof agg === "string" && isAggName(agg) ? agg : "sum";
}
