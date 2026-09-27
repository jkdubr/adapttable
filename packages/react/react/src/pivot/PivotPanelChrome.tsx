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
  moveField,
  PIVOT_AGGREGATIONS,
  type PivotConfig,
  type PivotField,
  pivotPanelZones,
  type PivotZone,
  removeField,
  resolveLabels,
  setMeasureAgg,
  type TableLabels,
} from "@adapttable/core";
import type { ReactNode } from "react";

export type { AggregateName, PivotConfig, PivotField, PivotZone };

/**
 * Props an adapter's panel surface receives.
 *
 * @public
 */
export interface PivotPanelSurfaceProps {
  /** Content rendered inside. */
  readonly children: ReactNode;
  /** Class for the element. */
  readonly className?: string;
  /** Spread onto the surface — the public part name. */
  readonly "data-adapttable-part": "pivot-panel";
}

/**
 * Props an adapter's zone receives — one titled list.
 *
 * @public
 */
export interface PivotZoneProps {
  /** Which zone this is, for styling and testing. */
  readonly zone: PivotZone;
  /** The zone's caption, already localized. */
  readonly label: string;
  /** Its entries, and the control that adds to it. */
  readonly children: ReactNode;
  /** Spread onto the zone — the public part name. */
  readonly "data-adapttable-part": "pivot-zone";
}

/**
 * Props an adapter's field row receives.
 *
 * @public
 */
export interface PivotFieldProps {
  /** What to call the field. */
  readonly label: string;
  /** Move it one step towards the outside. `undefined` when it is first. */
  readonly onMoveUp?: () => void;
  /** Move it one step towards the inside. `undefined` when it is last. */
  readonly onMoveDown?: () => void;
  /** Take it off this zone. */
  readonly onRemove: () => void;
  /** Accessible names for the three controls. */
  readonly moveUpLabel: string;
  /** Accessible name for the move-down control. */
  readonly moveDownLabel: string;
  /** Accessible name for the remove control. */
  readonly removeLabel: string;
  /** The aggregation chooser, for a measure. Absent on a dimension. */
  readonly aggregation?: ReactNode;
  /** Spread onto the field row — the public part name. */
  readonly "data-adapttable-part": "pivot-field";
}

/**
 * Props an adapter's "add a field" control receives.
 *
 * @public
 */
export interface PivotAddProps {
  /** Accessible name. */
  readonly label: string;
  /** The fields that can still be added. Empty means nothing is left. */
  readonly options: readonly PivotField[];
  /** Add one. */
  readonly onAdd: (key: string) => void;
}

/**
 * Props an adapter's aggregation chooser receives.
 *
 * @public
 */
export interface PivotAggProps {
  /** Accessible name. */
  readonly label: string;
  /** The current aggregation. */
  readonly value: AggregateName;
  /** What it can be. */
  readonly options: readonly AggregateName[];
  /** Change it. */
  readonly onChange: (next: AggregateName) => void;
}

/**
 * The kit-native pieces the panel is built from.
 *
 * @public
 */
export interface PivotPanelSlots {
  /** The panel body. */
  readonly Surface: (props: PivotPanelSurfaceProps) => ReactNode;
  /** One titled zone. */
  readonly Zone: (props: PivotZoneProps) => ReactNode;
  /** One field in a zone. */
  readonly Field: (props: PivotFieldProps) => ReactNode;
  /** The control that adds a field to a zone. */
  readonly Add: (props: PivotAddProps) => ReactNode;
  /** The aggregation chooser on a measure. */
  readonly Agg: (props: PivotAggProps) => ReactNode;
}

/**
 * What the panel needs to render.
 *
 * @public
 */
export interface PivotPanelChromeProps {
  /** Every field the user can pivot on. */
  fields: readonly PivotField[];
  /** The configuration being edited. */
  config: PivotConfig;
  /** Report a change. The panel never holds the configuration itself. */
  onChange: (next: PivotConfig) => void;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** The kit's controls. */
  slots: PivotPanelSlots;
  /** Class for the element. */
  className?: string;
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

  return (
    <Surface className={className} data-adapttable-part="pivot-panel">
      {pivotPanelZones(fields, config, labels).map(
        ({ zone, label, entries, addOptions }) => (
          <Zone
            key={zone}
            zone={zone}
            label={label}
            data-adapttable-part="pivot-zone"
          >
            {entries.map((entry) => (
              <Field
                key={entry.key}
                label={entry.label}
                data-adapttable-part="pivot-field"
                moveUpLabel={labels.pivotMoveUp}
                moveDownLabel={labels.pivotMoveDown}
                removeLabel={labels.pivotRemove}
                onMoveUp={
                  entry.canMoveUp
                    ? () => {
                        onChange(moveField(config, zone, entry.index, -1));
                      }
                    : undefined
                }
                onMoveDown={
                  entry.canMoveDown
                    ? () => {
                        onChange(moveField(config, zone, entry.index, 1));
                      }
                    : undefined
                }
                onRemove={() => {
                  onChange(removeField(config, zone, entry.index));
                }}
                aggregation={
                  entry.aggregation === undefined ? undefined : (
                    <Agg
                      label={labels.pivotAggregation}
                      value={entry.aggregation}
                      options={PIVOT_AGGREGATIONS}
                      onChange={(next) => {
                        onChange(setMeasureAgg(config, entry.index, next));
                      }}
                    />
                  )
                }
              />
            ))}
            <Add
              label={labels.pivotAdd}
              options={addOptions}
              onAdd={(key) => {
                onChange(assignField(config, key, zone));
              }}
            />
          </Zone>
        )
      )}
    </Surface>
  );
}
