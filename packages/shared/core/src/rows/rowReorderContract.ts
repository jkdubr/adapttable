/**
 * The row-reorder controls' contract: the props a kit's grip and mobile
 * buttons take, and the controls a kit fills the reorder Chrome with.
 *
 * Every binding's reorder Chrome lays out the same grip, the same pair of
 * up/down buttons and the same destination menu; only the components differ.
 * Rendered content is the binding's `TNode`, key events its `TKeyboardEvent`
 * and drag events its `TDragEvent`, and the reorder state is the binding's
 * own `TReorder`, so a React kit and an Angular kit fill the same shapes with
 * their own types.
 */
import type { RowReorderLabels } from "./rowReorderEngine";

/**
 * Props for a kit's `RowReorderHandle` — no slots on the public API.
 *
 * @typeParam TRow - The row type.
 * @typeParam TReorder - The binding's row-reorder state.
 *
 * @public
 */
export interface RowReorderHandleProps<TRow, TReorder = unknown> {
  /** Row-reorder state: what is being dragged and where it may land. */
  reorder: TReorder;
  /** Resolved labels, every key filled. */
  labels: RowReorderLabels;
  /** Identity of the row this control moves. */
  rowId: string;
  /** The row's index within the rendered window. */
  localIndex: number;
  /** The row being rendered. */
  row: TRow;
  /** Index of the first rendered row, so a windowed index maps back. */
  windowStart: number;
  /** Rows in the whole dataset, for the move bounds. */
  rowCount: number;
  /** Class for the element. */
  className?: string;
}

/**
 * Kit grip the reorder chrome calls.
 *
 * @typeParam TKeyboardEvent - The binding's key event (React's synthetic
 *   event in React, the DOM event elsewhere).
 * @typeParam TDragEvent - The binding's drag event.
 *
 * @public
 */
export interface RowReorderHandleSlotProps<
  TKeyboardEvent = KeyboardEvent,
  TDragEvent = DragEvent,
> {
  /** Accessible name for the control. */
  readonly label: string;
  /** Whether the grip is held. */
  readonly pressed: boolean;
  /** Whether a drag is in progress. */
  readonly dragging: boolean;
  /** Whether another move already owns confirmation. */
  readonly disabled: boolean;
  /** Class for the element. */
  readonly className?: string;
  /** Pointer bindings that start and track the drag. */
  readonly dragProps: {
    draggable: true;
    onDragStart: (event: TDragEvent) => void;
    onDragEnd: () => void;
  };
  /** Handles the keyboard move keys. */
  readonly onKeyDown: (event: TKeyboardEvent) => void;
}

/**
 * One option in the adapter-owned row destination menu.
 *
 * @public
 */
export interface RowMoveMenuItemProps {
  /** Stable destination id. */
  readonly id: string;
  /** Human-readable destination. */
  readonly label: string;
  /** Whether the destination is unavailable. */
  readonly disabled: boolean;
  /** Explanation exposed for an unavailable destination. */
  readonly disabledReason?: string;
  /** Selects this destination. */
  readonly onSelect: () => void;
}

/**
 * Pending move shown inside the adapter-owned menu surface.
 *
 * @public
 */
export interface RowMoveConfirmationProps {
  /** Confirmation heading. */
  readonly title: string;
  /** Concrete source-to-destination change. */
  readonly description: string;
  /** Approval button label. */
  readonly confirmLabel: string;
  /** Cancellation button label. */
  readonly cancelLabel: string;
  /** Commits the pending move. */
  readonly onConfirm: () => void;
  /** Discards the pending move. */
  readonly onCancel: () => void;
}

/**
 * Props for an adapter-owned nested row destination menu.
 *
 * @public
 */
export interface RowMoveMenuSlotProps {
  /** Accessible menu trigger and content label. */
  readonly label: string;
  /** Loaded move destinations. */
  readonly items: readonly RowMoveMenuItemProps[];
  /** Pending move to approve, when confirm policy is active. */
  readonly confirmation?: RowMoveConfirmationProps;
}

/**
 * Kit-supplied controls for the reorder grip's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TKeyboardEvent - The binding's key event.
 * @typeParam TDragEvent - The binding's drag event.
 *
 * @public
 */
export interface RowReorderHandleSlots<
  TNode = unknown,
  TKeyboardEvent = KeyboardEvent,
  TDragEvent = DragEvent,
> {
  /** Renders the drag grip. */
  readonly Handle: (
    props: RowReorderHandleSlotProps<TKeyboardEvent, TDragEvent>
  ) => TNode;
  /** Renders the nested-row destination menu and confirmation. */
  readonly Menu: (props: RowMoveMenuSlotProps) => TNode;
}

/**
 * Props for a kit's `RowReorderButtons` — no slots on the public API.
 *
 * @typeParam TRow - The row type.
 * @typeParam TReorder - The binding's row-reorder state.
 *
 * @public
 */
export interface RowReorderButtonsProps<TRow, TReorder = unknown> {
  /** Row-reorder state: what is being dragged and where it may land. */
  reorder: TReorder;
  /** Resolved labels, every key filled. */
  labels: RowReorderLabels;
  /** The row's index within the rendered window. */
  localIndex: number;
  /** The row being rendered. */
  row: TRow;
  /** Index of the first rendered row, so a windowed index maps back. */
  windowStart: number;
  /** Rows in the whole dataset, for the move bounds. */
  rowCount: number;
  /** Class for the element. */
  className?: string;
  /** Class for the move-up button. */
  upClassName?: string;
  /** Class for the move-down button. */
  downClassName?: string;
}

/**
 * Kit button the mobile reorder chrome calls.
 *
 * @public
 */
export interface RowReorderMoveButtonProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Part name, so styling can target this element. */
  readonly part: string;
  /** Whether the control is offered but not available. */
  readonly disabled: boolean;
  /** Class for the element. */
  readonly className?: string;
  /** Called when pressed. */
  readonly onClick: () => void;
}

/**
 * Kit-supplied controls for the mobile reorder buttons' Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface RowReorderButtonsSlots<TNode = unknown> {
  /** Renders one move button. */
  readonly Button: (props: RowReorderMoveButtonProps) => TNode;
  /** Renders the nested-row destination menu and confirmation. */
  readonly Menu: (props: RowMoveMenuSlotProps) => TNode;
}
