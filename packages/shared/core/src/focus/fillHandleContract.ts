/**
 * The fill handle's contract: the props a kit's visible handle takes and the
 * component a kit fills the fill-handle Chrome with.
 *
 * Every binding's Chrome decides the same corner and supplies the same drag
 * props; only the visible handle differs. Rendered content is the binding's
 * `TNode`, so a React kit and an Angular kit fill the same shapes with their
 * own types.
 */

/**
 * Props passed to an adapter's visible fill-handle component.
 *
 * @public
 */
export interface FillHandleSlotProps {
  /** Localized accessible title for the pointer affordance. */
  readonly label: string;
  /** Event handlers and drag metadata from the grid-focus engine. */
  readonly handleProps: Readonly<Record<string, unknown>>;
  /** Adapter-defined class supplied by its table component. */
  readonly className?: string;
}

/**
 * Kit-owned rendering for the fill-handle Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface FillHandleSlots<TNode = unknown> {
  /** Renders the drag handle. */
  readonly Handle: (props: FillHandleSlotProps) => TNode;
}
