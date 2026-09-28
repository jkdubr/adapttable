import { type TableLabels } from "@adapttable/core";
import {
  type ColumnGroupToggleProps,
  type ColumnGroupToggleSlots as NeutralColumnGroupToggleSlots,
  type HeaderGroupCell,
} from "@adapttable/core/binding";
import type { ReactElement, ReactNode } from "react";

export type {
  ColumnGroupToggleButtonProps,
  ColumnGroupToggleProps,
} from "@adapttable/core/binding";

/**
 * Adapter-supplied controls for {@link ColumnGroupToggleChrome} —
 * `@adapttable/core`'s `ColumnGroupToggleSlots` drawing React nodes.
 *
 * @public
 */
export type ColumnGroupToggleSlots = NeutralColumnGroupToggleSlots<ReactNode>;

/**
 * Props for {@link ColumnGroupToggleChrome}.
 *
 * @public
 */
export interface ColumnGroupToggleChromeProps extends ColumnGroupToggleProps {
  /** The kit's components for each part. */
  readonly slots: ColumnGroupToggleSlots;
}

/**
 * Collapse/expand control for one column-group header cell.
 *
 * @public
 */
export function ColumnGroupToggleChrome({
  cell,
  labels,
  onToggle,
  className,
  slots,
}: Readonly<ColumnGroupToggleChromeProps>): ReactElement {
  const id = cell.id;
  if (!cell.collapsible || id === null) return <></>;
  const Button = slots.Button;
  return (
    <Button
      label={toggleLabel(cell, labels)}
      expanded={!cell.collapsed}
      className={className}
      onClick={() => onToggle(id)}
    />
  );
}

function toggleLabel(
  cell: HeaderGroupCell,
  labels: Required<TableLabels>
): string {
  const action = cell.collapsed
    ? labels.expandColumnGroup
    : labels.collapseColumnGroup;
  return cell.label ? `${action}: ${cell.label}` : action;
}
