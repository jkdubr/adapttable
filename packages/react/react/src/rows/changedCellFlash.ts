/**
 * A brief mark on the cells a patch just changed.
 *
 * When rows arrive over a socket the screen changes without anyone touching
 * it, and a number that quietly becomes a different number is a number nobody
 * notices. A short pulse says "this one moved" — and then gets out of the way,
 * because a permanent mark is just a second kind of noise.
 *
 * The table paints nothing itself: a changed cell carries `data-flash` and a
 * kit's stylesheet decides what that looks like, exactly as `data-dirty`
 * already works. And it never animates against
 * `prefers-reduced-motion` — a flash nobody asked for is a bug, not a feature.
 */
import {
  CHANGED_CELL_FLASH_MS,
  createChangedCellFlashStore,
  type RowPatchEvent,
} from "@adapttable/core";
import {
  useCallback,
  useDebugValue,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export type { RowPatchEvent };

/**
 * What {@link useChangedCellFlash} needs.
 *
 * @public
 */
export interface UseChangedCellFlashOptions {
  /**
   * Turn it on. Off by default — a table that never patches rows should not
   * pay for a timer, and a flash on a table nobody is watching is wasted.
   */
  enabled?: boolean;
  /** How long each mark lasts. Defaults to 1200 ms. */
  durationMs?: number;
}

/**
 * Marks a host can read while rendering.
 *
 * @public
 */
export interface ChangedCellFlashState {
  /** Whether this cell changed recently enough to still be marked. */
  isFlashing: (rowId: string, columnKey: string) => boolean;
  /** Whether any cell in the row is marked — for a row-level tint. */
  isRowFlashing: (rowId: string) => boolean;
  /**
   * The attribute a cell spreads. Empty when the cell is not marked, so a
   * renderer can spread it unconditionally.
   */
  flashProps: (
    rowId: string,
    columnKey: string
  ) => { "data-flash"?: "" } | Record<string, never>;
  /** Feed the events a patch produced. Ignored while disabled. */
  mark: (events: readonly RowPatchEvent<unknown>[]) => void;
  /** Drop every mark now — a refetch, a page change, a filter. */
  clear: () => void;
}

/**
 * Track the cells a patch changed, briefly.
 *
 * @param options - See {@link UseChangedCellFlashOptions}.
 * @returns The marks; every reader is inert while disabled.
 *
 * @public
 */
export function useChangedCellFlash(
  options: UseChangedCellFlashOptions = {}
): ChangedCellFlashState {
  const { enabled = false, durationMs = CHANGED_CELL_FLASH_MS } = options;
  const reduced = usePrefersReducedMotion();
  const live = enabled && !reduced;

  // The generation only exists to repaint; the marks live in the store so a
  // burst of patches does not queue a render per patch.
  const storeOptions = { live, durationMs };
  const [store] = useState(() => createChangedCellFlashStore(storeOptions));
  store.configure(storeOptions);
  const generation = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  useDebugValue(generation);

  // Timers must not outlive the table.
  useEffect(() => store.clear, [store]);
  // Turning it off (or a reduced-motion preference arriving) drops what is
  // already on screen rather than leaving it lit.
  useEffect(() => {
    if (!live) store.clear();
  }, [live, store]);

  const isRowFlashing = useCallback(
    (rowId: string) => live && store.isRowFlashing(rowId),
    [live, store]
  );

  const isFlashing = useCallback(
    (rowId: string, columnKey: string) =>
      live && store.isFlashing(rowId, columnKey),
    [live, store]
  );

  const flashProps = useCallback(
    (rowId: string, columnKey: string) =>
      isFlashing(rowId, columnKey) ? { "data-flash": "" as const } : {},
    [isFlashing]
  );

  return {
    isFlashing,
    isRowFlashing,
    flashProps,
    mark: store.mark,
    clear: store.clear,
  };
}
