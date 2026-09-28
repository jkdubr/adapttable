/**
 * Windowed columns, for tables that are wide rather than long.
 *
 * Row windowing solves the common case; a table with five hundred columns has
 * the same problem sideways, and no amount of row windowing helps it — 23 rows
 * of 478 columns is still eleven thousand cells. This windows the horizontal
 * axis on the same principle: render what a reader can see, plus a margin, and
 * hold the rest open with two spacer cells.
 *
 * Two rules make it safe to compose with everything else:
 *
 * **Pinned columns are always rendered.** A pinned column is on screen by
 * definition, whatever the scroll position, so it can never be windowed out —
 * the window is computed over the scrollable columns only.
 *
 * **The spacers are logical.** A cell whose width holds open the columns to
 * the reader's LEFT is the one before the window in reading order, which in
 * Arabic is the one on the right. Sizing them as leading/trailing rather than
 * left/right is what makes a wide RTL table scroll correctly.
 */
import {
  type ColumnViewport,
  columnWindowPlan,
  readColumnViewport,
} from "@adapttable/core/binding";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ColumnDef } from "../columnDef";

/**
 * What {@link useColumnWindow} needs.
 *
 * @public
 */
export interface UseColumnWindowOptions<TRow> {
  /** The columns as rendered, in order. */
  columns: readonly ColumnDef<TRow>[];
  /** Off unless the host asked for it and the table is wide enough to need it. */
  enabled: boolean;
  /** Measured or declared widths, by column key. */
  widths?: Readonly<Record<string, number>>;
  /** Keys that are pinned, and so always rendered. */
  pinnedKeys?: ReadonlySet<string>;
  /** The horizontal scroll container. */
  getScrollElement?: () => HTMLElement | null;
  /** Columns to render either side of the visible span. Defaults to 3. */
  overscan?: number;
}

/**
 * The windowed columns and the space the rest occupies.
 *
 * @public
 */
export interface ColumnWindow<TRow> {
  /** Whether the returned columns are a window rather than everything. */
  enabled: boolean;
  /** The columns to render, pinned ones included. */
  columns: readonly ColumnDef<TRow>[];
  /** Width of the spacer before the window, in pixels. */
  paddingStart: number;
  /** Width of the spacer after it. */
  paddingEnd: number;
}

/**
 * Window a table's columns to what is scrolled into view.
 *
 * @typeParam TRow - The row type.
 * @param options - See {@link UseColumnWindowOptions}.
 * @returns The window; every column and no spacers when disabled.
 *
 * @public
 */
export function useColumnWindow<TRow>(
  options: UseColumnWindowOptions<TRow>
): ColumnWindow<TRow> {
  const {
    columns,
    enabled,
    widths,
    pinnedKeys,
    getScrollElement,
    overscan = 3,
  } = options;
  const [viewport, setViewport] = useState<ColumnViewport>({
    start: 0,
    width: 0,
  });
  // The accessor arrives fresh from the caller every render; reading it
  // through a ref keeps the scroll listener from being torn down and
  // reattached on every keystroke elsewhere in the table.
  const scrollElement = useRef(getScrollElement);
  scrollElement.current = getScrollElement;

  const read = useCallback(() => {
    const element = scrollElement.current?.();
    if (!element) return;
    const next = readColumnViewport(element);
    // Same numbers, same object: a fresh one every scroll event would
    // re-render the whole table at 60fps for nothing.
    setViewport((current) =>
      current.start === next.start && current.width === next.width
        ? current
        : next
    );
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const element = scrollElement.current?.();
    if (!element) return undefined;
    read();
    element.addEventListener("scroll", read, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            read();
          });
    observer?.observe(element);
    return () => {
      element.removeEventListener("scroll", read);
      observer?.disconnect();
    };
  }, [enabled, read]);

  return useMemo(
    () =>
      columnWindowPlan({
        columns,
        enabled,
        viewport,
        widths,
        pinnedKeys,
        overscan,
      }),
    [enabled, columns, widths, pinnedKeys, viewport, overscan]
  );
}
