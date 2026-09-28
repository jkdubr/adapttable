/**
 * The editable cell's contract: the controls a kit fills the cell gate with.
 *
 * Every binding's gate draws the same idle activate control and the same
 * conflict / undo buttons; only the components differ. Rendered content is
 * the binding's `TNode`, so a React kit and an Angular kit fill the same
 * shapes with their own types.
 */

/**
 * Kit activate control the gate calls while the cell is idle.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface EditableCellActivateProps<TNode = unknown> {
  /** Tooltip for the control. */
  readonly title: string;
  /** Class for the element. */
  readonly className?: string;
  /** Save state for this cell, when one is being reported. */
  readonly saveStatus: string | undefined;
  /** Whether the cell holds an unsaved edit. */
  readonly dirty: boolean;
  /** Ref to the control, so the gate can put focus back. */
  readonly activateRef: (node: HTMLButtonElement | null) => void;
  /** What the cell shows while idle. */
  readonly display: TNode;
  /** Opens the editor on a double click. */
  readonly onDoubleClick: (event: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => void;
  /** Called when pressed. */
  readonly onClick: (event: { stopPropagation: () => void }) => void;
  /** Handles the keys this control owns. */
  readonly onKeyDown: (event: {
    key: string;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => void;
}

/**
 * Kit button the gate calls for conflict choices and undo.
 *
 * @public
 */
export interface EditableCellButtonProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Part name, so styling can target this element. */
  readonly part: string;
  /** Class for the element. */
  readonly className?: string;
  /** Called on press, before focus moves. */
  readonly onMouseDown?: (event: { preventDefault: () => void }) => void;
  /** Called when pressed. */
  readonly onClick: (event: { stopPropagation: () => void }) => void;
}

/**
 * Kit-supplied controls for the editable cell gate.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface EditableCellSlots<TNode = unknown> {
  /** Renders the idle cell that opens the editor. */
  readonly Activate: (props: EditableCellActivateProps<TNode>) => TNode;
  /** Renders a conflict-resolution button. */
  readonly Button: (props: EditableCellButtonProps) => TNode;
}
