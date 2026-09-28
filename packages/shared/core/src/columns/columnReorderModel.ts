/**
 * The column-menu reorder: which drags start, which key moves a column, and
 * where the drop indicator sits.
 *
 * A binding wires these rules to its own drag and keyboard events; the rules
 * themselves take plain values so every binding moves columns the same way.
 */

/**
 * MIME type carrying the dragged column key during a reorder drag.
 *
 * @public
 */
export const COLUMN_DND_MIME = "application/x-adapttable-column";

/**
 * The part of a drag's target the start rule reads.
 *
 * @public
 */
export interface ColumnDragTarget {
  /** The nearest ancestor (or self) matching a selector, as the DOM's `closest`. */
  closest: (selector: string) => unknown;
}

/**
 * Whether a drag starting on `target` may move its column. The whole menu row
 * is draggable, so the drag image is the full row — but a drag starting on an
 * interactive control (the eye or pin buttons) would hijack its click. The
 * reorder grip is exempt even when a kit renders it as a button: it carries
 * `data-adapttable-grip`, and dragging from it is the strongest affordance of
 * all.
 *
 * @param target - Where the drag started, or `null`.
 * @returns False when the drag must be cancelled.
 *
 * @public
 */
export function columnDragAllowed(target: ColumnDragTarget | null): boolean {
  if (!target) return true;
  return (
    target.closest("button,input,select,a") == null ||
    target.closest("[data-adapttable-grip]") != null
  );
}

/**
 * The move a key on the reorder grip asks for — the accessible equivalent of
 * the pointer drag. Up and Down always mean earlier and later in the order;
 * Left and Right follow the writing direction, so in RTL ArrowRight moves the
 * column toward the start (visually right).
 *
 * @param key - The pressed key's `KeyboardEvent.key`.
 * @param rtl - Whether the grip sits in a right-to-left context.
 * @returns `-1` toward the start, `1` toward the end, or `undefined` for a
 *   key the grip ignores.
 *
 * @public
 */
export function columnReorderKeyStep(
  key: string,
  rtl: boolean
): -1 | 1 | undefined {
  const horizontal = key === "ArrowLeft" || key === "ArrowRight";
  const vertical = key === "ArrowUp" || key === "ArrowDown";
  if (!horizontal && !vertical) return undefined;
  // The arrow that points toward the inline start: ArrowLeft in LTR,
  // ArrowRight in RTL (where the first column renders on the right).
  const startKey = rtl ? "ArrowRight" : "ArrowLeft";
  const towardStart = horizontal ? key === startKey : key === "ArrowUp";
  return towardStart ? -1 : 1;
}

/**
 * Indicator attributes for a column-menu row during a reorder drag.
 *
 * @public
 */
export interface ColumnDragRowAttrs {
  /** Present on the row being dragged (kits dim it). */
  "data-dragging"?: "";
  /** Present on the hovered drop target, with the insertion edge. */
  "data-drop"?: "before" | "after";
}

/**
 * A reorder drag in flight: the column moving and where it came from.
 *
 * @public
 */
export interface ColumnDragSource {
  /** The dragged column's key. */
  readonly key: string;
  /** Its index when the drag started. */
  readonly from: number;
}

/**
 * The indicator attributes for one row. The dragged row is dimmed; the
 * hovered target shows the edge the column lands on — `move` inserts the
 * dragged column AT the target index, so coming from later in the order it
 * lands before that row, and from earlier it lands after.
 *
 * @param drag - The drag in flight, or `null`.
 * @param overIndex - The hovered drop index, or `null`.
 * @param key - This row's column key.
 * @param index - This row's index.
 * @returns The row's attributes; empty outside a drag.
 *
 * @public
 */
export function columnDragRowAttrs(
  drag: ColumnDragSource | null,
  overIndex: number | null,
  key: string,
  index: number
): ColumnDragRowAttrs {
  if (!drag) return {};
  // The source row matches by key, so the hovered-target branch below can
  // never be the dragged row itself.
  if (drag.key === key) return { "data-dragging": "" };
  if (overIndex !== index) return {};
  return { "data-drop": index < drag.from ? "before" : "after" };
}
