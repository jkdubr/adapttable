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

/**
 * The part of a drag event's `dataTransfer` column reordering reads and
 * writes. A browser `DataTransfer` fits, and so does React's.
 *
 * @public
 */
export interface ColumnDataTransfer {
  /** The formats carried by the drag. */
  readonly types: readonly string[];
  /** Put a value on the drag. */
  setData: (format: string, data: string) => void;
  /** Read a value off the drag. */
  getData: (format: string) => string;
  /** The operations the source allows. */
  effectAllowed: string;
  /** The operation the target accepts. */
  dropEffect: string;
}

/**
 * A drag event as column reordering sees it: a native `DragEvent` or a
 * framework's wrapper around one.
 *
 * @public
 */
export interface ColumnDragEvent {
  /** The element the event started on. */
  readonly target: EventTarget | null;
  /** The drag's data; absent on events a browser fires without one. */
  readonly dataTransfer: ColumnDataTransfer | null;
  /** Whether a handler has already claimed the event. */
  readonly defaultPrevented: boolean;
  /** Claim the event. */
  preventDefault: () => void;
}

/**
 * A key event on a column's reorder grip.
 *
 * @public
 */
export interface ColumnReorderKeyEvent {
  /** The key pressed. */
  readonly key: string;
  /** The grip, read for its writing direction. */
  readonly currentTarget: EventTarget | null;
  /** Claim the event. */
  preventDefault: () => void;
}

/**
 * Start a column drag from a menu row: refuse it when it began on a control
 * inside the row, otherwise put the column key on the drag.
 *
 * @param event - The drag-start event.
 * @param key - The column being dragged.
 *
 * @public
 */
export function startColumnDrag(event: ColumnDragEvent, key: string): void {
  if (!columnDragAllowed(event.target as ColumnDragTarget | null)) {
    event.preventDefault();
    return;
  }
  if (!event.dataTransfer) return;
  event.dataTransfer.setData(COLUMN_DND_MIME, key);
  event.dataTransfer.effectAllowed = "move";
}

/**
 * Accept a column drag over a drop target, and only a column drag.
 *
 * @param event - The drag-over event.
 *
 * @public
 */
export function acceptColumnDrag(event: ColumnDragEvent): void {
  if (!event.dataTransfer?.types.includes(COLUMN_DND_MIME)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

/**
 * Finish a column drag on a drop target: move the dragged column there.
 *
 * @param event - The drop event.
 * @param index - The target index.
 * @param move - Moves a column to a new index.
 *
 * @public
 */
export function dropColumn(
  event: ColumnDragEvent,
  index: number,
  move: (key: string, toIndex: number) => void
): void {
  const key = event.dataTransfer?.getData(COLUMN_DND_MIME) ?? "";
  if (key === "") return;
  event.preventDefault();
  move(key, index);
}

/**
 * Move a column with the keyboard from its grip: arrows step toward the
 * inline start or end, following the grip's writing direction.
 *
 * @param event - The key event.
 * @param key - The column on the grip.
 * @param index - Its current index.
 * @param move - Moves a column to a new index.
 * @param isRtl - Reads the grip's writing direction.
 *
 * @public
 */
export function columnReorderKeyDown(
  event: ColumnReorderKeyEvent,
  key: string,
  index: number,
  move: (key: string, toIndex: number) => void,
  isRtl: (element: EventTarget | null) => boolean
): void {
  const step = columnReorderKeyStep(event.key, isRtl(event.currentTarget));
  if (step === undefined) return;
  event.preventDefault();
  move(key, index + step);
}

/**
 * What a column drag in progress looks like.
 *
 * @public
 */
export interface ColumnDragSnapshot {
  /** The column being dragged and where it started, or `null`. */
  readonly drag: ColumnDragSource | null;
  /** The hovered drop index, or `null`. */
  readonly overIndex: number | null;
}

/**
 * The column-drag state behind a column menu's reorder rows. A binding
 * subscribes to it and hands it the drag events its framework delivers.
 *
 * @public
 */
export interface ColumnDragController {
  /** Subscribe to changes; returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /** The current drag. */
  readonly getSnapshot: () => ColumnDragSnapshot;
  /** A row's drag started. */
  readonly dragStart: (
    event: ColumnDragEvent,
    key: string,
    index: number
  ) => void;
  /** A column drag is over a row. */
  readonly dragOver: (event: ColumnDragEvent, index: number) => void;
  /** A column was dropped on a row. */
  readonly drop: (
    event: ColumnDragEvent,
    index: number,
    move: (key: string, toIndex: number) => void
  ) => void;
  /** The drag ended, dropped or not. */
  readonly end: () => void;
  /** A row's drag indicator attributes. */
  readonly rowAttrs: (key: string, index: number) => ColumnDragRowAttrs;
}

const IDLE: ColumnDragSnapshot = { drag: null, overIndex: null };

/**
 * Create the column-drag state for one column menu.
 *
 * @public
 */
export function createColumnDragController(): ColumnDragController {
  let snapshot = IDLE;
  const listeners = new Set<() => void>();
  const set = (next: ColumnDragSnapshot): void => {
    if (next.drag === snapshot.drag && next.overIndex === snapshot.overIndex) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) listener();
  };
  const end = (): void => set(IDLE);
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    dragStart(event, key, index) {
      startColumnDrag(event, key);
      if (!event.defaultPrevented)
        set({ ...snapshot, drag: { key, from: index } });
    },
    dragOver(event, index) {
      acceptColumnDrag(event);
      if (event.defaultPrevented) set({ ...snapshot, overIndex: index });
    },
    drop(event, index, move) {
      dropColumn(event, index, move);
      end();
    },
    end,
    rowAttrs: (key, index) =>
      columnDragRowAttrs(snapshot.drag, snapshot.overIndex, key, index),
  };
}
