/**
 * The built-in features' configuration, framework-neutral.
 *
 * Each factory here is what a built-in feature WRITES: the patch its `apply`
 * returns and, where it takes registrations in its options, the `setup` that
 * hands them to the live host. A binding's own factory spreads one of these
 * and adds what it draws (a provider, slot renders), so every binding turns
 * the same options into the same table configuration.
 */
import type { Command } from "../actions/commandRegistry";
import type {
  ContextMenuItem,
  ContextMenuTarget,
} from "../actions/contextMenuModel";
import { columnResizeHandleProps } from "../columns/columnResize";
import type { ExportWriter } from "../export/exportWriter";
import type { FilterTypeSpec } from "../filters/filterRegistry";
import { buildBodyCells } from "../rows/cellSpan";
import {
  extraCoveredTableSlots,
  inflateBodyCellRowSpans,
  insertExtraRows,
  insertExtrasBeforeRows,
} from "../rows/extraRows";
import { extraHostFillStyle } from "../rows/rowPresentation";
import type { SidePanelEntry } from "./currentHost";
import type { FeaturePatch, PatchFeature } from "./featurePatch";

/**
 * The registrations a built-in feature's options can carry.
 *
 * Every binding's live host has these; a built-in's `setup` asks for no
 * more than it uses, so it runs against any of them.
 *
 * @public
 */
export interface CoreFeatureRegistrar<
  TPanel extends SidePanelEntry = SidePanelEntry,
> {
  /** Register a filter type for this table. */
  registerFilterType(spec: FilterTypeSpec): void;
  /** Register an export writer. */
  registerWriter(writer: ExportWriter): void;
  /** Register a side-panel tab. */
  registerPanel(panel: TPanel): void;
  /** Register a command-palette command. */
  registerCommand(command: Command): void;
}

/**
 * The registrations a row-shaped option can carry, on top of
 * {@link CoreFeatureRegistrar}.
 *
 * @public
 */
export interface CoreRowFeatureRegistrar<
  TRow = unknown,
  TPanel extends SidePanelEntry = SidePanelEntry,
> extends CoreFeatureRegistrar<TPanel> {
  /** Register extra context-menu entries. */
  registerContextMenuItems(
    items: (target: ContextMenuTarget<TRow>) => readonly ContextMenuItem[]
  ): void;
}

/**
 * A built-in feature's neutral half: its id, its patch, and — when its
 * options carry registrations — its `setup`.
 *
 * @public
 */
export interface CoreFeature<
  TRow = unknown,
  THost = CoreFeatureRegistrar,
> extends PatchFeature<TRow> {
  /** Hand the options' registrations to the live host. */
  setup?(host: THost): void;
}

function define<TRow>(
  id: string,
  patch: FeaturePatch<TRow>
): CoreFeature<TRow> {
  return { id, apply: () => patch };
}

/** Options a windowing feature accepts — a boolean or its knobs. */
export type VirtualizeInput =
  | boolean
  | {
      virtualizeColumns?: boolean;
      estimateRowSize?: number;
      estimateCardSize?: number;
      virtualOverscan?: number;
      virtualScrollMargin?: number;
    };

/**
 * The neutral half of every built-in feature, by factory name.
 *
 * Option types a binding owns (its side-panel entry, its saved-views
 * options, its filter form) are generic here; the binding's factory pins
 * them.
 *
 * @public
 */
export const coreFeatures = {
  /** A host plugin or an ad-hoc patch. */
  feature<TRow>(id: string, patch: FeaturePatch<TRow> = {}): CoreFeature<TRow> {
    return define(id, patch);
  },
  /** Merge cells that share a value across rows or columns. */
  cellSpan<TRow>(
    getCellSpan: unknown,
    cellSpanAppearance?: unknown
  ): CoreFeature<TRow> {
    return define("cell-span", {
      getCellSpan,
      cellSpanAppearance,
      assembly: { buildBodyCells },
    });
  },
  /** Separator or full-width rows between the data rows. */
  extraRows(rows: readonly unknown[]): CoreFeature {
    return define("extra-rows", {
      extraRows: rows,
      assembly: {
        insertExtraRows,
        insertExtrasBeforeRows,
        extraHostFillStyle,
        inflateBodyCellRowSpans,
        extraCoveredTableSlots,
      },
    });
  },
  /** Host-owned summary objects stuck above and below the body. */
  pinnedSummaryRows<TRow>(pinnedRows: unknown): CoreFeature<TRow> {
    return define("pinned-summary-rows", { pinnedRows });
  },
  /** Class, style and height per row. */
  rowAppearance<TRow>(options: FeaturePatch<TRow>): CoreFeature<TRow> {
    return define("row-appearance", options);
  },
  /** The per-column menu. */
  columnMenu(): CoreFeature {
    return define("column-menu", { enableColumnMenu: true });
  },
  /** Columns resized by dragging their edge. */
  resizableColumns(): CoreFeature {
    return define("resizable-columns", {
      resizableColumns: true,
      assembly: { columnResizeHandleProps },
    });
  },
  /** Grouped column headers that collapse to a summary. */
  collapsibleColumnGroups(): CoreFeature {
    return define("collapsible-column-groups", {
      collapsibleColumnGroups: true,
    });
  },
  /** The command palette; its `commands` register on the host. */
  commandPalette(
    options: boolean | { readonly commands?: readonly Command[] } = true
  ): CoreFeature {
    const commands = typeof options === "object" ? options.commands : undefined;
    const feature = define("command-palette", { commandPalette: options });
    if (!commands?.length) return feature;
    return {
      ...feature,
      setup(host) {
        for (const command of commands) host.registerCommand(command);
      },
    };
  },
  /** Right-click menus; their `items` register on the host. */
  contextMenu<TRow>(
    options:
      | boolean
      | {
          readonly items?: (
            target: ContextMenuTarget<TRow>
          ) => readonly ContextMenuItem[];
        } = true
  ): CoreFeature<TRow, CoreRowFeatureRegistrar<TRow>> {
    const items = typeof options === "object" ? options.items : undefined;
    const feature = define<TRow>("context-menu", { contextMenu: options });
    if (!items) return feature;
    return {
      ...feature,
      setup: (host: CoreRowFeatureRegistrar<TRow>) =>
        host.registerContextMenuItems(items),
    };
  },
  /** The side panel; its `panels` register on the host. */
  sidePanel<TPanel extends SidePanelEntry>(options: {
    readonly panels: readonly TPanel[];
  }): CoreFeature<unknown, CoreFeatureRegistrar<TPanel>> {
    return {
      ...define("side-panel", { sidePanel: options }),
      setup(host) {
        for (const panel of options.panels) host.registerPanel(panel);
      },
    };
  },
  /** Actions that run against the selected rows. */
  bulkActions(actions: readonly unknown[]): CoreFeature {
    return define("bulk-actions", { bulkActions: actions });
  },
  /** Custom filter types; each registers on the host. */
  filterTypes(specs: readonly FilterTypeSpec[]): CoreFeature {
    return {
      ...define("filter-types", { filterTypes: specs }),
      setup(host) {
        for (const spec of specs) host.registerFilterType(spec);
      },
    };
  },
  /** A filter control under each column header. */
  headerFilters(): CoreFeature {
    return define("header-filters", { headerFilters: true });
  },
  /** Saved, named and restored views. */
  savedViews(options: unknown): CoreFeature {
    return define("saved-views", { savedViews: options });
  },
  /** A print action that lays the table out for paper. */
  print(onPrint: () => void, printButton = false): CoreFeature {
    return define("print", { onPrint, printButton });
  },
  /** The status bar under the table. */
  statusBar(): CoreFeature {
    return define("status-bar", { statusBar: true });
  },
  /** Undo and redo controls for edits. */
  undoRedoButtons(): CoreFeature {
    return define("undo-redo-buttons", { undoRedoButtons: true });
  },
  /** Sorting by more than one column at a time. */
  multiSort(): CoreFeature {
    return define("multi-sort", { multiSort: true });
  },
  /** Columns sized to their content. */
  fitColumns(): CoreFeature {
    return define("fit-columns", { fitColumns: true });
  },
  /** A checkbox per column header for column selection. */
  columnSelectionCheckbox(): CoreFeature {
    return define("column-selection-checkbox", {
      columnSelectionCheckbox: true,
    });
  },
  /** A keyboard grid with a focused cell. */
  cellNavigation(
    options: { readonly onRangeChange?: (range: never) => void } = {}
  ): CoreFeature {
    return define(
      "cell-navigation",
      options.onRangeChange
        ? { cellNavigation: true, onCellRangeChange: options.onRangeChange }
        : { cellNavigation: true }
    );
  },
  /** A control that switches row density. */
  densityChooser(): CoreFeature {
    return define("density-chooser", { densityChooser: true });
  },
  /** Undo and redo of edits. */
  editHistory(options: unknown = true): CoreFeature {
    return define("edit-history", { editHistory: options });
  },
  /** Edit a single cell in place. */
  editing<TRow>(
    onCellEdit: unknown,
    extras?: FeaturePatch<TRow>
  ): CoreFeature<TRow> {
    return define("editing", { onCellEdit, ...extras });
  },
  /** Edit a whole row at once. */
  rowEditing<TRow>(
    onRowEdit: unknown,
    extras?: FeaturePatch<TRow>
  ): CoreFeature<TRow> {
    return define("row-editing", { rowEditing: true, onRowEdit, ...extras });
  },
  /** Collect edits and save them in one batch. */
  batchEditing<TRow>(
    onBatchEdit: unknown,
    extras?: FeaturePatch<TRow>
  ): CoreFeature<TRow> {
    return define("batch-editing", {
      batchEditing: true,
      onBatchEdit,
      ...extras,
    });
  },
  /** Marks on cells and rows with unsaved edits. */
  dirtyIndicators(): CoreFeature {
    return define("dirty-indicators", { dirtyIndicators: true });
  },
  /** CSV export; a custom `writer` registers on the host. */
  exportCsv<TRow>(
    options: boolean | { readonly writer?: ExportWriter } = true
  ): CoreFeature<TRow> {
    const writer = typeof options === "object" ? options.writer : undefined;
    const feature = define<TRow>("export-csv", { exportCsv: options });
    if (!writer) return feature;
    return { ...feature, setup: (host) => host.registerWriter(writer) };
  },
  /** The filter panel, declarative or a binding's own form. */
  filters<TRow>(defs: unknown): CoreFeature<TRow> {
    return define("filters", { filters: defs });
  },
  /** The find bar. */
  findInTable(): CoreFeature {
    return define("find-in-table", { findInTable: true });
  },
  /** A control that takes the table fullscreen. */
  fullscreen(): CoreFeature {
    return define("fullscreen", { fullscreen: true });
  },
  /** Group rows under collapsible headers. */
  grouping<TRow>(
    groupBy: string | readonly string[],
    extras?: object
  ): CoreFeature<TRow> {
    return define("grouping", { groupBy, ...extras });
  },
  /**
   * The grouping panel: grouping's options without an initial `groupBy`,
   * which the panel owns as state.
   */
  groupingPanel<TRow>(
    groupBy?: string | readonly string[],
    extras: object = {}
  ): CoreFeature<TRow> {
    const base = coreFeatures.grouping<TRow>(groupBy ?? [], extras);
    return {
      id: "grouping-panel",
      apply(input) {
        const withoutInitialGroup = { ...base.apply?.(input) };
        delete withoutInitialGroup.groupBy;
        return withoutInitialGroup;
      },
    };
  },
  /** Row actions, and the add / duplicate / delete handlers. */
  rowActions<TRow>(
    actions?: readonly unknown[],
    handlers?: {
      readonly onAddRow?: unknown;
      readonly onDuplicateRow?: unknown;
      readonly onDeleteRow?: unknown;
      readonly confirmDeleteRow?: unknown;
    }
  ): CoreFeature<TRow> {
    return define("row-actions", {
      ...(actions ? { rowActions: actions } : {}),
      ...(handlers
        ? {
            onAddRow: handlers.onAddRow,
            onDuplicateRow: handlers.onDuplicateRow,
            onDeleteRow: handlers.onDeleteRow,
            confirmDeleteRow: handlers.confirmDeleteRow,
          }
        : {}),
    });
  },
  /** A panel under an expanded row. */
  rowDetail<TRow>(
    renderRowDetail: unknown,
    defaultExpandedRowIds?: readonly string[]
  ): CoreFeature<TRow> {
    return define("row-detail", { renderRowDetail, defaultExpandedRowIds });
  },
  /** A whole table inside a row's detail panel. */
  nestedTable<TRow>(
    nested: unknown,
    defaultExpandedRowIds?: readonly string[]
  ): CoreFeature<TRow> {
    return define("nested-table", {
      nestedTable: nested,
      defaultExpandedRowIds,
    });
  },
  /** Rows pinned to the top or bottom. */
  rowPinning(options: FeaturePatch = {}): CoreFeature {
    return define("row-pinning", { rowPinningArmed: true, ...options });
  },
  /** Aggregates for the selected cells. */
  selectionStats(): CoreFeature {
    return define("selection-stats", { selectionStats: true });
  },
  /** Rows as an expandable tree. */
  tree<TRow>(options: FeaturePatch<TRow> = {}): CoreFeature<TRow> {
    return define("tree", options);
  },
  /** Render only the rows in view. */
  virtualize(options: VirtualizeInput = true): CoreFeature {
    return define(
      "virtualize",
      typeof options === "boolean"
        ? { virtualize: options }
        : { virtualize: true, ...options }
    );
  },
} as const;
