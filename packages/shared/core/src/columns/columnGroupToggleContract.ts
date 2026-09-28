/**
 * The column-group toggle's contract: the props a kit's toggle takes and the
 * button a kit fills the toggle Chrome with.
 *
 * Every binding's column-group Chrome decides the same label and state; only
 * the button differs. Rendered content is the binding's `TNode`, so a React
 * kit and an Angular kit fill the same shapes with their own types.
 */
import type { TableLabels } from "../types";
import type { HeaderGroupCell } from "./headerGroups";

/**
 * Props for a kit's `ColumnGroupToggle` — no slots on the public API.
 *
 * @public
 */
export interface ColumnGroupToggleProps {
  /** The cell being rendered. */
  cell: HeaderGroupCell;
  /** Resolved labels, every key filled. */
  labels: Required<TableLabels>;
  /** Called with the new state. */
  onToggle: (id: string) => void;
  /** Class for the element. */
  className?: string;
}

/**
 * Kit button the column-group chrome calls.
 *
 * @public
 */
export interface ColumnGroupToggleButtonProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Whether the section is open. */
  readonly expanded: boolean;
  /** Class for the element. */
  readonly className?: string;
  /** Called when pressed. */
  readonly onClick: () => void;
}

/**
 * Kit-supplied controls for the column-group toggle's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface ColumnGroupToggleSlots<TNode = unknown> {
  /** Renders a button. */
  readonly Button: (props: ColumnGroupToggleButtonProps) => TNode;
}
