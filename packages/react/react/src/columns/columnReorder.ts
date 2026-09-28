import {
  COLUMN_DND_MIME,
  columnDragAllowed,
  type ColumnDragRowAttrs,
  columnDragRowAttrs,
  type ColumnDragSource,
  columnReorderKeyStep,
  isRtlElement,
} from "@adapttable/core";
import {
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useState,
} from "react";

export type { ColumnDragRowAttrs } from "@adapttable/core";
export { COLUMN_DND_MIME } from "@adapttable/core";

/**
 * Props that make a whole menu ROW draggable (so the browser's drag image is
 * the full row — you see the column move). Pair with `columnDropProps`.
 *
 * @public
 */
export interface ColumnRowDragProps {
  /** Always true — the whole row is the drag source. */
  draggable: true;
  /** Starts the drag and puts the column key on the dataTransfer. */
  onDragStart: (event: DragEvent<HTMLElement>) => void;
}

/**
 * Build drag props for a column-menu row. The entire row is the drag handle,
 * matching the native drag-image so the reorder feels physical.
 *
 * @param key - Column key being reordered.
 *
 * @public
 */
export function columnRowDragProps(key: string): ColumnRowDragProps {
  return {
    draggable: true,
    onDragStart: (event) => {
      // A drag starting on an interactive control (the eye/pin buttons)
      // would hijack its click; the reorder grip is exempt.
      if (!columnDragAllowed(event.target as HTMLElement | null)) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData(COLUMN_DND_MIME, key);
      event.dataTransfer.effectAllowed = "move";
    },
  };
}

/**
 * Props for a small, focusable reorder grip — keyboard a11y for the row drag.
 *
 * @public
 */
export interface ColumnReorderKeyProps {
  /** `button`, so the grip is announced as an action. */
  role: "button";
  /** Always 0 — the grip is reachable by Tab. */
  tabIndex: 0;
  /** The grip's accessible name, naming the column it moves. */
  "aria-label": string;
  /** Marks the element as a reorder grip, for styling and tests. */
  "data-adapttable-grip": "";
  /** Moves the column on the arrow keys. */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Build keyboard props for the reorder grip. Arrow keys move the column one
 * slot — the accessible equivalent of the pointer drag. Up/Down always mean
 * earlier/later in the order; Left/Right follow the writing direction, so in
 * RTL pressing ArrowRight moves the column toward the start (visually right).
 *
 * @param key - Column key being reordered.
 * @param index - The column's current index in the full order.
 * @param move - Layout mutator that moves a column to a new index.
 * @param label - Accessible label for the grip.
 *
 * @public
 */
export function columnReorderKeyProps(
  key: string,
  index: number,
  move: (key: string, toIndex: number) => void,
  label: string
): ColumnReorderKeyProps {
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": label,
    "data-adapttable-grip": "",
    onKeyDown: (event) => {
      // An explicit `[dir]` ancestor wins (what the adapters set on the
      // root), falling back to the resolved CSS `direction`.
      const step = columnReorderKeyStep(
        event.key,
        isRtlElement(event.currentTarget)
      );
      if (step === undefined) return;
      event.preventDefault();
      move(key, index + step);
    },
  };
}

/**
 * Props for a row that accepts a dropped column, moving it to this index.
 *
 * @public
 */
export interface ColumnDropProps {
  /** Marks the row as a valid drop target while a column is over it. */
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  /** Completes the reorder. */
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

/**
 * Build drop props for a reorder target: moves the dragged column to this
 * row's `index` on drop.
 *
 * @param index - Target index the dragged column moves to.
 * @param move - Layout mutator that moves a column to a new index.
 *
 * @public
 */
export function columnDropProps(
  index: number,
  move: (key: string, toIndex: number) => void
): ColumnDropProps {
  return {
    onDragOver: (event) => {
      if (!event.dataTransfer.types.includes(COLUMN_DND_MIME)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    onDrop: (event) => {
      const key = event.dataTransfer.getData(COLUMN_DND_MIME);
      if (key === "") return;
      event.preventDefault();
      move(key, index);
    },
  };
}

/**
 * Live drag state + composed prop builders from `useColumnDragState`.
 *
 * @public
 */
export interface ColumnDragState {
  /** Key currently being dragged, or `null` outside a drag. */
  draggingKey: string | null;
  /** Hovered drop index, or `null`. */
  overIndex: number | null;
  /** Drag props for a row — `columnRowDragProps` + state tracking. */
  rowDragProps: (
    key: string,
    index: number
  ) => ColumnRowDragProps & {
    onDragEnd: () => void;
  };
  /** Drop props for a row — `columnDropProps` + hover tracking. */
  dropProps: (
    index: number,
    move: (key: string, toIndex: number) => void
  ) => ColumnDropProps;
  /** Indicator data-attributes for a row; style them with kit CSS. */
  rowAttrs: (key: string, index: number) => ColumnDragRowAttrs;
}

/**
 * Drop-position feedback for the column-menu reorder. Composes the existing
 * drag/drop prop builders with the tracking they lack, so adapters can show
 * WHERE the dragged column will land instead of leaving the user to guess:
 * the dragged row carries `data-dragging` (dim it) and the hovered target
 * carries `data-drop="before" | "after"` (draw an insertion line on that
 * edge). State clears on drop, drag end, and drag cancel alike.
 *
 * @public
 */
export function useColumnDragState(): ColumnDragState {
  const [drag, setDrag] = useState<ColumnDragSource | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = useCallback(() => {
    setDrag(null);
    setOverIndex(null);
  }, []);

  const rowDragProps = useCallback<ColumnDragState["rowDragProps"]>(
    (key, index) => {
      const base = columnRowDragProps(key);
      return {
        ...base,
        onDragStart: (event) => {
          base.onDragStart(event);
          // The base handler cancels drags that start on interactive
          // controls — only track the ones it allowed.
          if (!event.defaultPrevented) setDrag({ key, from: index });
        },
        onDragEnd: reset,
      };
    },
    [reset]
  );

  const dropProps = useCallback<ColumnDragState["dropProps"]>(
    (index, move) => {
      const base = columnDropProps(index, move);
      return {
        onDragOver: (event) => {
          base.onDragOver(event);
          // Only a column drag (accepted above) marks a target.
          if (event.defaultPrevented) setOverIndex(index);
        },
        onDrop: (event) => {
          base.onDrop(event);
          reset();
        },
      };
    },
    [reset]
  );

  const rowAttrs = useCallback<ColumnDragState["rowAttrs"]>(
    (key, index) => columnDragRowAttrs(drag, overIndex, key, index),
    [drag, overIndex]
  );

  return {
    draggingKey: drag?.key ?? null,
    overIndex,
    rowDragProps,
    dropProps,
    rowAttrs,
  };
}
