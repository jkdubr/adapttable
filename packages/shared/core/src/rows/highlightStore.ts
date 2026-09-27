/**
 * "Flash the row I just created" — the marks, and the clocks that clear them.
 *
 * Reduced motion does not mean no feedback: a user who asked for less motion
 * still needs to know which row changed. So the mark still appears and still
 * clears — it holds steady instead of fading, and holds longer to make up for
 * the missing transition.
 *
 * A highlight also has to survive the row moving. Sorting, filtering and
 * paging all reorder rows, so marks are keyed by row id and cell address and
 * travel with the data.
 */

/**
 * How long an animated highlight lasts, in milliseconds.
 *
 * @public
 */
export const HIGHLIGHT_FADE_MS = 1500;

/**
 * How long a steady (reduced-motion) highlight lasts, in milliseconds: a mark
 * that does not animate needs more time to be noticed.
 *
 * @public
 */
export const HIGHLIGHT_STEADY_MS = 2500;

/**
 * How long a highlight lasts.
 *
 * @param reducedMotion - Whether the user asked for reduced motion.
 * @returns The duration in milliseconds.
 *
 * @public
 */
export function highlightDuration(reducedMotion: boolean): number {
  return reducedMotion ? HIGHLIGHT_STEADY_MS : HIGHLIGHT_FADE_MS;
}

/**
 * One highlighted cell.
 *
 * @public
 */
export interface HighlightedCell {
  /** Identity of the row. */
  rowId: string;
  /** Key of the column. */
  columnKey: string;
}

/**
 * The marks at one moment.
 *
 * @public
 */
export interface HighlightSnapshot {
  /** Marked row ids. */
  readonly rows: ReadonlySet<string>;
  /** Marked cells, keyed by {@link highlightCellKey}. */
  readonly cells: ReadonlySet<string>;
}

/**
 * The key a marked cell is stored under.
 *
 * @param rowId - The row's id.
 * @param columnKey - The column's key.
 * @returns The key.
 *
 * @public
 */
export function highlightCellKey(rowId: string, columnKey: string): string {
  return `${rowId} ${columnKey}`;
}

/**
 * What a highlight store is configured with.
 *
 * @public
 */
export interface HighlightStoreOptions {
  /** Off unless the host asked; every flash is then ignored. */
  readonly enabled: boolean;
  /** How long a mark lasts; see {@link highlightDuration}. */
  readonly durationMs: number;
}

/**
 * The highlight marks and their timers.
 *
 * @public
 */
export interface HighlightStore {
  /** The current marks. A new object whenever they change. */
  readonly getSnapshot: () => HighlightSnapshot;
  /** Listen for changes. Returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Replace the configuration — a binding calls this on every render. */
  readonly configure: (options: HighlightStoreOptions) => void;
  /** Mark a row. Repeating it restarts the clock rather than stacking. */
  readonly flashRow: (rowId: string) => void;
  /** Mark one cell. */
  readonly flashCell: (cell: HighlightedCell) => void;
  /** Drop every mark now. */
  readonly clear: () => void;
  /** Stop every pending clock without touching the marks — on teardown. */
  readonly dispose: () => void;
}

/**
 * Create a highlight store with no marks.
 *
 * @param initial - The first configuration.
 * @returns The store.
 *
 * @public
 */
export function createHighlightStore(
  initial: HighlightStoreOptions
): HighlightStore {
  let options = initial;
  let snapshot: HighlightSnapshot = { rows: new Set(), cells: new Set() };
  // One timer per mark, so a second flash restarts that mark's clock without
  // disturbing any other.
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const listeners = new Set<() => void>();

  const write = (next: HighlightSnapshot): void => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  const dispose = (): void => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  };

  const schedule = (key: string, drop: () => void): void => {
    const existing = timers.get(key);
    if (existing) clearTimeout(existing);
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        drop();
      }, options.durationMs)
    );
  };

  const without = (set: ReadonlySet<string>, key: string) => {
    const next = new Set(set);
    next.delete(key);
    return next;
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    configure(next) {
      options = next;
    },
    flashRow(rowId) {
      if (!options.enabled) return;
      write({ ...snapshot, rows: new Set(snapshot.rows).add(rowId) });
      schedule(`row:${rowId}`, () => {
        write({ ...snapshot, rows: without(snapshot.rows, rowId) });
      });
    },
    flashCell({ rowId, columnKey }) {
      if (!options.enabled) return;
      const key = highlightCellKey(rowId, columnKey);
      write({ ...snapshot, cells: new Set(snapshot.cells).add(key) });
      schedule(`cell:${key}`, () => {
        write({ ...snapshot, cells: without(snapshot.cells, key) });
      });
    },
    clear() {
      dispose();
      write({ rows: new Set(), cells: new Set() });
    },
    dispose,
  };
}
