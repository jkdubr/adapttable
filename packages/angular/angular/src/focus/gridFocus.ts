/**
 * Keyboard navigation over table cells — the Angular binding.
 *
 * With it on, the table is one tab stop whose interior the arrow keys reach.
 * The keyboard model lives in core's grid-focus controller: the active cell,
 * the selected range, the key dispatch, copy and the announcement. This
 * adapter configures it from the table's signals, follows its snapshot, moves
 * DOM focus after each render, and merges its attributes into the table's.
 * Off, the attributes are the table's own and nothing listens.
 */
import {
  type CellRange,
  createGridFocusController,
  type GridCell,
  gridCellAttributes,
  gridColumnHeaderAttributes,
  gridContainerAttributes,
  type GridFocusControllerOptions,
  gridRowAttributes,
} from "@adapttable/core";
import {
  afterRenderEffect,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  Injector,
  type Signal,
  untracked,
} from "@angular/core";

import type { Attrs } from "../attrs";
import type { ColumnDef } from "../columnDef";
import type { DataTable } from "../dataTable";
import { fromStore, type MaybeSignal, readMaybe } from "../store";

/**
 * Options for {@link injectGridFocus}.
 *
 * @public
 */
export interface GridFocusOptions<TRow> {
  /** The table whose cells the keys move between. */
  readonly table: DataTable<TRow>;
  /** Whether cell navigation is on. Off, the table is a plain table. */
  readonly enabled: MaybeSignal<boolean>;
  /** Enter or F2 on a cell. */
  readonly onActivate?: (cell: GridCell) => void;
  /** The injector to run in. Omit to use the current injection context. */
  readonly injector?: Injector;
}

/**
 * Cell navigation for a table: its state, and attribute getters that wrap the
 * table's own with the grid's roles, indices and handlers.
 *
 * @public
 */
export interface GridFocus<TRow> {
  /** Whether cell navigation is on. */
  readonly enabled: Signal<boolean>;
  /** The focused cell, or `null` before the grid has been entered. */
  readonly active: Signal<GridCell | null>;
  /** The selected rectangle, or `null`. */
  readonly range: Signal<CellRange | null>;
  /** What the grid says as focus moves; render it in a live region. */
  readonly announcement: Signal<string>;
  /** Move focus to a cell. */
  readonly focusCell: (cell: GridCell) => void;
  /** The table element's attributes, the grid's merged in. */
  readonly tableAttrs: () => Attrs;
  /** A header cell's attributes, with its column position. */
  readonly headerCellAttrs: (column: ColumnDef<TRow>, col: number) => Attrs;
  /** A body row's attributes, with its row position. */
  readonly rowAttrs: (row: TRow, index: number) => Attrs;
  /**
   * A body cell's attributes: its address, its roving tab stop and the
   * pointer handlers.
   */
  readonly cellAttrs: (
    column: ColumnDef<TRow>,
    index: number,
    col: number
  ) => Attrs;
}

/**
 * Keyboard focus over a table's cells.
 *
 * @param options - See {@link GridFocusOptions}.
 * @returns The grid; see {@link GridFocus}.
 *
 * @public
 */
export function injectGridFocus<TRow>(
  options: GridFocusOptions<TRow>
): GridFocus<TRow> {
  if (!options.injector) assertInInjectionContext(injectGridFocus);
  const injector = options.injector ?? inject(Injector);
  const { table } = options;
  const enabled = computed(() => readMaybe(options.enabled));

  const configuration = computed((): GridFocusControllerOptions<TRow> => ({
    enabled: enabled(),
    rowCount: table.source().total,
    columns: table.columns(),
    rows: table.rows(),
    getRowId: table.rowKey,
    firstRowIndex: table.windowStart(),
    dir: table.dir(),
    labels: table.labels(),
    onActivate: options.onActivate,
  }));
  const controller = createGridFocusController(untracked(configuration));
  effect(
    () => {
      controller.configure(configuration());
    },
    { injector }
  );
  const snapshot = fromStore(controller, { injector });

  // The DOM follows the state: once a render has produced the cell a move
  // was waiting for, focus it.
  afterRenderEffect(
    () => {
      snapshot();
      table.rows();
      if (enabled()) controller.syncFocus();
    },
    { injector }
  );

  // A pointer released outside the table would leave a drag armed.
  effect(
    (onCleanup) => {
      if (!enabled() || typeof window === "undefined") return;
      onCleanup(controller.watchPointerRelease(window));
    },
    { injector }
  );

  const windowed = (): boolean =>
    table.source().total > table.source().rows.length;

  const cellAttrs = (
    column: ColumnDef<TRow>,
    index: number,
    col: number
  ): Attrs => {
    const cell = { row: table.windowStart() + index, col };
    const { active, range, fillPreview } = snapshot();
    const grid = gridCellAttributes(
      {
        enabled: enabled(),
        columnsWindowed: false,
        active,
        firstRowIndex: table.windowStart(),
        range,
        fillPreview,
      },
      cell
    );
    if (!enabled()) return { ...table.cellAttrs(column), ...grid };
    return {
      ...table.cellAttrs(column),
      ...grid,
      onMouseDown: (event: MouseEvent) => {
        controller.pressCell(cell, event);
      },
      onMouseEnter: () => {
        controller.enterCell(cell);
      },
      onMouseUp: controller.releaseCell,
      onFocus: () => {
        controller.trackFocus(cell);
      },
    };
  };

  return {
    enabled,
    active: computed(() => (enabled() ? snapshot().active : null)),
    range: computed(() => (enabled() ? snapshot().range : null)),
    announcement: computed(() => (enabled() ? snapshot().announcement : "")),
    focusCell: controller.focusCell,
    tableAttrs: () => {
      const base = table.tableAttrs();
      if (!enabled()) return base;
      return {
        ...base,
        ...gridContainerAttributes({
          enabled: true,
          windowed: windowed(),
          columnsWindowed: false,
          rowCount: table.source().total,
          colCount: table.columns().length,
        }),
        onKeyDown: controller.keyDown,
        ref: controller.attach,
      };
    },
    headerCellAttrs: (column, col) => ({
      ...table.headerCellAttrs(column),
      ...gridColumnHeaderAttributes(
        { enabled: enabled(), columnsWindowed: false },
        col
      ),
    }),
    rowAttrs: (row, index) => ({
      ...table.rowAttrs(row, index),
      ...gridRowAttributes(
        { enabled: enabled(), windowed: windowed() },
        table.windowStart() + index
      ),
    }),
    cellAttrs,
  };
}
