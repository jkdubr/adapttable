/**
 * The multi-select cell editor's contract: the checkbox a kit fills its
 * Chrome with, for kits whose select holds one value.
 *
 * Every binding's multi-select editor Chrome owns the group, its accessible
 * name, which option takes focus and when a blur means "done"; each kit
 * supplies the checkbox. Rendered content is the binding's `TNode` and key
 * events are its `TKeyboardEvent`, so a React kit and an Angular kit fill the
 * same shapes with their own types.
 */

/**
 * One option's checkbox, rendered by the adapter with its kit's control.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TKeyboardEvent - The binding's key event (React's synthetic
 *   event in React, the DOM event elsewhere).
 *
 * @public
 */
export interface MultiSelectEditorCheckboxProps<
  TNode = unknown,
  TKeyboardEvent = KeyboardEvent,
> {
  /** The option's visible text. */
  readonly label: TNode;
  /** The option's value — unique within the editor. */
  readonly value: string;
  /** Whether the draft currently holds this value. */
  readonly checked: boolean;
  /** Add or remove this value from the draft. */
  readonly onToggle: () => void;
  /**
   * Present on the FIRST option only. Attach it to the kit's control so the
   * editor takes focus when the cell opens, exactly as a single-control editor
   * does through its editor controller's `focusRef`.
   */
  readonly focusRef?: (node: { focus: () => void } | null) => void;
  /**
   * The editor's key handling — Enter commits, Escape cancels. It belongs on
   * the controls themselves rather than the group: a group is not an
   * interactive element, and keys arrive at whichever option has focus.
   */
  readonly onKeyDown: (event: TKeyboardEvent) => void;
}

/**
 * Kit-supplied controls for the multi-select editor's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TKeyboardEvent - The binding's key event.
 *
 * @public
 */
export interface MultiSelectEditorSlots<
  TNode = unknown,
  TKeyboardEvent = KeyboardEvent,
> {
  /** Renders a checkbox. */
  readonly Checkbox: (
    props: MultiSelectEditorCheckboxProps<TNode, TKeyboardEvent>
  ) => TNode;
}
