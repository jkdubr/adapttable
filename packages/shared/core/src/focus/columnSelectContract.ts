/**
 * The column-select checkbox's contract: the props its Chrome takes and the
 * checkbox a kit fills it with.
 *
 * Every binding's Chrome owns the same reveal, containment and accessible
 * name; only the checkbox differs. Rendered content is the binding's `TNode`,
 * so a React kit and an Angular kit fill the same shapes with their own types.
 */

/**
 * The kit checkbox the column-select Chrome calls.
 *
 * @public
 */
export interface ColumnSelectCheckboxProps {
  /** Accessible name, already localized and already naming the column. */
  readonly label: string;
  /** Whether this column is the selection. */
  readonly checked: boolean;
  /** Select this column, or clear the selection when it already is. */
  readonly onToggle: () => void;
}

/**
 * Kit-supplied control for the column-select Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface ColumnSelectSlots<TNode = unknown> {
  /** Renders a checkbox. */
  readonly Checkbox: (props: ColumnSelectCheckboxProps) => TNode;
}

/**
 * Props for the column-select Chrome, less the slots each binding adds with
 * its own node type.
 *
 * @public
 */
export interface ColumnSelectCheckboxChromeProps {
  /** Accessible name for the control, already localized. */
  readonly label: string;
  /** Whether this column is the selection. */
  readonly checked: boolean;
  /** Select this column, or clear the selection when it already is. */
  readonly onToggle: () => void;
  /** `classNames.columnSelect`, for the kits that carry per-part classes. */
  readonly className?: string;
}
