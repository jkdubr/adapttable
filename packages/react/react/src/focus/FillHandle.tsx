/**
 * Headless fill-handle gate. Core decides whether the current cell is the
 * selection corner and supplies the drag props; the adapter renders the
 * visible handle with its own component and styling.
 */
import { sameGridCell } from "@adapttable/core";
import type { FillHandleSlots as NeutralFillHandleSlots } from "@adapttable/core/binding";
import type { ReactNode } from "react";

import type { GridFocusState } from "./useGridFocus";

export type { FillHandleSlotProps } from "@adapttable/core/binding";

/**
 * Adapter-owned rendering for {@link FillHandleChrome} — `@adapttable/core`'s
 * `FillHandleSlots` drawing React nodes.
 *
 * @public
 */
export type FillHandleSlots = NeutralFillHandleSlots<ReactNode>;

/**
 * Props for {@link FillHandleChrome}.
 *
 * @public
 */
export interface FillHandleChromeProps {
  /** The grid focus state, straight from `table.gridFocus`. */
  readonly focus: GridFocusState | undefined;
  /** The cell's index in the RENDERED window — what an adapter already has. */
  readonly windowIndex: number;
  /** The cell's column index. */
  readonly col: number;
  /** Where the rendered window starts in the dataset. Zero unless paged. */
  readonly firstRowIndex?: number;
  /** A kit's own class for the visible affordance. */
  readonly className?: string;
  /** Adapter-owned visible component. */
  readonly slots: FillHandleSlots;
}

/**
 * Renders the fill handle when this cell is the selection's corner, and
 * nothing at all otherwise — so an adapter renders it unconditionally in every
 * cell and the opt-in promise still holds.
 *
 * @public
 */
export function FillHandleChrome({
  focus,
  windowIndex,
  col,
  firstRowIndex = 0,
  className,
  slots,
}: Readonly<FillHandleChromeProps>): ReactNode {
  const corner = focus?.fillHandleCell;
  if (!corner || !focus) return null;
  if (!sameGridCell(corner, { row: firstRowIndex + windowIndex, col })) {
    return null;
  }
  const Handle = slots.Handle;
  return (
    <Handle
      label={focus.fillHandleLabel}
      handleProps={focus.getFillHandleProps()}
      className={className}
    />
  );
}
