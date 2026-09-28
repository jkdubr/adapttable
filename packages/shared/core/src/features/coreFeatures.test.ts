import { describe, expect, it, vi } from "vitest";

import type { Command } from "../actions/commandRegistry";
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
import {
  type CoreFeature,
  coreFeatures,
  type CoreRowFeatureRegistrar,
} from "./coreFeatures";
import { applyTableFeatures } from "./featurePatch";

function patch(factory: CoreFeature<never, never>): Record<string, unknown> {
  const result = factory.apply?.({});
  if (result === undefined) throw new Error("factory produced no patch");
  return { ...result };
}

function mockHost() {
  return {
    registerFilterType: vi.fn(),
    registerWriter: vi.fn(),
    registerPanel: vi.fn(),
    registerCommand: vi.fn(),
    registerContextMenuItems: vi.fn(),
  } satisfies CoreRowFeatureRegistrar;
}

const command: Command = { key: "go", label: "Go", onSelect: () => undefined };

describe("coreFeatures — flag features", () => {
  it.each([
    ["columnMenu", "column-menu", { enableColumnMenu: true }],
    [
      "collapsibleColumnGroups",
      "collapsible-column-groups",
      { collapsibleColumnGroups: true },
    ],
    ["headerFilters", "header-filters", { headerFilters: true }],
    ["statusBar", "status-bar", { statusBar: true }],
    ["undoRedoButtons", "undo-redo-buttons", { undoRedoButtons: true }],
    ["multiSort", "multi-sort", { multiSort: true }],
    ["fitColumns", "fit-columns", { fitColumns: true }],
    [
      "columnSelectionCheckbox",
      "column-selection-checkbox",
      { columnSelectionCheckbox: true },
    ],
    ["densityChooser", "density-chooser", { densityChooser: true }],
    ["dirtyIndicators", "dirty-indicators", { dirtyIndicators: true }],
    ["findInTable", "find-in-table", { findInTable: true }],
    ["fullscreen", "fullscreen", { fullscreen: true }],
    ["selectionStats", "selection-stats", { selectionStats: true }],
  ] as const)("%s has id %s and writes its flag", (name, id, expected) => {
    const made = coreFeatures[name]();
    expect(made.id).toBe(id);
    expect(patch(made)).toEqual(expected);
    expect(made.setup).toBeUndefined();
  });
});

describe("coreFeatures — configured features", () => {
  it("feature writes an ad-hoc patch, empty by default", () => {
    const made = coreFeatures.feature("audit", { statusBar: true });
    expect(made.id).toBe("audit");
    expect(patch(made)).toEqual({ statusBar: true });
    expect(patch(coreFeatures.feature("bare"))).toEqual({});
  });

  it("cellSpan writes the getter, the appearance and its assembly", () => {
    const getCellSpan = vi.fn();
    const made = coreFeatures.cellSpan(getCellSpan, "plain");
    expect(made.id).toBe("cell-span");
    expect(patch(made)).toEqual({
      getCellSpan,
      cellSpanAppearance: "plain",
      assembly: { buildBodyCells },
    });
  });

  it("extraRows writes the list and its assembly", () => {
    const rows = [{ key: "sep" }];
    const made = coreFeatures.extraRows(rows);
    expect(made.id).toBe("extra-rows");
    expect(patch(made)).toEqual({
      extraRows: rows,
      assembly: {
        insertExtraRows,
        insertExtrasBeforeRows,
        extraHostFillStyle,
        inflateBodyCellRowSpans,
        extraCoveredTableSlots,
      },
    });
  });

  it("cellSpan and extraRows compose their assemblies", () => {
    const resolved: Record<string, unknown> = applyTableFeatures({
      features: [coreFeatures.cellSpan(vi.fn()), coreFeatures.extraRows([])],
    });
    expect(resolved.assembly).toEqual({
      buildBodyCells,
      insertExtraRows,
      insertExtrasBeforeRows,
      extraHostFillStyle,
      inflateBodyCellRowSpans,
      extraCoveredTableSlots,
    });
  });

  it("pinnedSummaryRows writes the host objects", () => {
    const pinnedRows = { top: [{ id: "t" }] };
    const made = coreFeatures.pinnedSummaryRows(pinnedRows);
    expect(made.id).toBe("pinned-summary-rows");
    expect(patch(made)).toEqual({ pinnedRows });
  });

  it("rowAppearance writes its options as given", () => {
    const rowClassName = vi.fn();
    const made = coreFeatures.rowAppearance({ rowClassName, rowHeight: 32 });
    expect(made.id).toBe("row-appearance");
    expect(patch(made)).toEqual({ rowClassName, rowHeight: 32 });
  });

  it("resizableColumns writes the flag and the handle props", () => {
    const made = coreFeatures.resizableColumns();
    expect(made.id).toBe("resizable-columns");
    expect(patch(made)).toEqual({
      resizableColumns: true,
      assembly: { columnResizeHandleProps },
    });
  });

  it("bulkActions writes the actions", () => {
    const actions = [{ key: "archive" }];
    const made = coreFeatures.bulkActions(actions);
    expect(made.id).toBe("bulk-actions");
    expect(patch(made)).toEqual({ bulkActions: actions });
  });

  it("savedViews writes its options", () => {
    const options = { storageKey: "v" };
    const made = coreFeatures.savedViews(options);
    expect(made.id).toBe("saved-views");
    expect(patch(made)).toEqual({ savedViews: options });
  });

  it("print writes the handler and hides the button by default", () => {
    const onPrint = vi.fn();
    const made = coreFeatures.print(onPrint);
    expect(made.id).toBe("print");
    expect(patch(made)).toEqual({ onPrint, printButton: false });
    expect(patch(coreFeatures.print(onPrint, true))).toEqual({
      onPrint,
      printButton: true,
    });
  });

  it("cellNavigation writes the range callback only when given", () => {
    const made = coreFeatures.cellNavigation();
    expect(made.id).toBe("cell-navigation");
    expect(patch(made)).toEqual({ cellNavigation: true });
    expect(Object.keys(patch(made))).toEqual(["cellNavigation"]);
    const onRangeChange = vi.fn();
    expect(patch(coreFeatures.cellNavigation({ onRangeChange }))).toEqual({
      cellNavigation: true,
      onCellRangeChange: onRangeChange,
    });
  });

  it("editHistory writes its options, true by default", () => {
    const made = coreFeatures.editHistory();
    expect(made.id).toBe("edit-history");
    expect(patch(made)).toEqual({ editHistory: true });
    expect(patch(coreFeatures.editHistory({ limit: 5 }))).toEqual({
      editHistory: { limit: 5 },
    });
  });

  it("editing writes onCellEdit and its extras", () => {
    const onCellEdit = vi.fn();
    const made = coreFeatures.editing(onCellEdit, { dirtyIndicators: true });
    expect(made.id).toBe("editing");
    expect(patch(made)).toEqual({ onCellEdit, dirtyIndicators: true });
    expect(patch(coreFeatures.editing(onCellEdit))).toEqual({ onCellEdit });
  });

  it("rowEditing arms row editing with its handler and extras", () => {
    const onRowEdit = vi.fn();
    const made = coreFeatures.rowEditing(onRowEdit, { extra: 1 });
    expect(made.id).toBe("row-editing");
    expect(patch(made)).toEqual({ rowEditing: true, onRowEdit, extra: 1 });
    expect(patch(coreFeatures.rowEditing(onRowEdit))).toEqual({
      rowEditing: true,
      onRowEdit,
    });
  });

  it("batchEditing arms batch editing with its handler and extras", () => {
    const onBatchEdit = vi.fn();
    const made = coreFeatures.batchEditing(onBatchEdit, { extra: 1 });
    expect(made.id).toBe("batch-editing");
    expect(patch(made)).toEqual({ batchEditing: true, onBatchEdit, extra: 1 });
    expect(patch(coreFeatures.batchEditing(onBatchEdit))).toEqual({
      batchEditing: true,
      onBatchEdit,
    });
  });

  it("filters writes the definitions", () => {
    const defs = [{ key: "status" }];
    const made = coreFeatures.filters(defs);
    expect(made.id).toBe("filters");
    expect(patch(made)).toEqual({ filters: defs });
  });

  it("grouping writes groupBy and its extras", () => {
    const made = coreFeatures.grouping("team", { groupAggregates: true });
    expect(made.id).toBe("grouping");
    expect(patch(made)).toEqual({ groupBy: "team", groupAggregates: true });
    expect(patch(coreFeatures.grouping(["a", "b"]))).toEqual({
      groupBy: ["a", "b"],
    });
  });

  it("groupingPanel keeps grouping's extras but never an initial groupBy", () => {
    const made = coreFeatures.groupingPanel("team", { groupAggregates: true });
    expect(made.id).toBe("grouping-panel");
    expect(patch(made)).toEqual({ groupAggregates: true });
    expect(patch(coreFeatures.groupingPanel())).toEqual({});
  });

  it("rowActions writes only what it was given", () => {
    const actions = [{ key: "open" }];
    const onAddRow = vi.fn();
    const onDuplicateRow = vi.fn();
    const onDeleteRow = vi.fn();
    expect(coreFeatures.rowActions().id).toBe("row-actions");
    expect(patch(coreFeatures.rowActions())).toEqual({});
    expect(patch(coreFeatures.rowActions(actions))).toEqual({
      rowActions: actions,
    });
    expect(
      patch(
        coreFeatures.rowActions(actions, {
          onAddRow,
          onDuplicateRow,
          onDeleteRow,
          confirmDeleteRow: false,
        })
      )
    ).toEqual({
      rowActions: actions,
      onAddRow,
      onDuplicateRow,
      onDeleteRow,
      confirmDeleteRow: false,
    });
    const handlersOnly = patch(
      coreFeatures.rowActions(undefined, { onAddRow })
    );
    expect(handlersOnly).toMatchObject({ onAddRow });
    expect(handlersOnly).not.toHaveProperty("rowActions");
  });

  it("rowDetail writes the renderer and the expanded ids", () => {
    const renderRowDetail = vi.fn();
    const made = coreFeatures.rowDetail(renderRowDetail, ["a"]);
    expect(made.id).toBe("row-detail");
    expect(patch(made)).toEqual({
      renderRowDetail,
      defaultExpandedRowIds: ["a"],
    });
  });

  it("nestedTable writes the nested table and the expanded ids", () => {
    const nested = vi.fn();
    const made = coreFeatures.nestedTable(nested, ["a"]);
    expect(made.id).toBe("nested-table");
    expect(patch(made)).toEqual({
      nestedTable: nested,
      defaultExpandedRowIds: ["a"],
    });
  });

  it("rowPinning arms pinning and writes its options", () => {
    const made = coreFeatures.rowPinning();
    expect(made.id).toBe("row-pinning");
    expect(patch(made)).toEqual({ rowPinningArmed: true });
    const onPinnedRowIdsChange = vi.fn();
    expect(
      patch(
        coreFeatures.rowPinning({
          pinnedRowIds: { top: ["a"], bottom: [] },
          onPinnedRowIdsChange,
        })
      )
    ).toEqual({
      rowPinningArmed: true,
      pinnedRowIds: { top: ["a"], bottom: [] },
      onPinnedRowIdsChange,
    });
  });

  it("tree writes its options, empty by default", () => {
    const getSubRows = vi.fn();
    const made = coreFeatures.tree({ getSubRows });
    expect(made.id).toBe("tree");
    expect(patch(made)).toEqual({ getSubRows });
    expect(patch(coreFeatures.tree())).toEqual({});
  });

  it("virtualize normalizes a boolean or its knobs", () => {
    const made = coreFeatures.virtualize();
    expect(made.id).toBe("virtualize");
    expect(patch(made)).toEqual({ virtualize: true });
    expect(patch(coreFeatures.virtualize(false))).toEqual({
      virtualize: false,
    });
    expect(
      patch(
        coreFeatures.virtualize({ virtualizeColumns: true, virtualOverscan: 4 })
      )
    ).toEqual({
      virtualize: true,
      virtualizeColumns: true,
      virtualOverscan: 4,
    });
  });
});

describe("coreFeatures — registering features", () => {
  it("commandPalette writes its options and registers commands", () => {
    const bare = coreFeatures.commandPalette();
    expect(bare.id).toBe("command-palette");
    expect(patch(bare)).toEqual({ commandPalette: true });
    expect(bare.setup).toBeUndefined();

    expect(coreFeatures.commandPalette(false).setup).toBeUndefined();
    expect(coreFeatures.commandPalette({}).setup).toBeUndefined();
    expect(coreFeatures.commandPalette({ commands: [] }).setup).toBeUndefined();

    const options = { commands: [command, { ...command, key: "stop" }] };
    const made = coreFeatures.commandPalette(options);
    expect(made.id).toBe("command-palette");
    expect(patch(made)).toEqual({ commandPalette: options });
    const host = mockHost();
    made.setup?.(host);
    expect(host.registerCommand.mock.calls).toEqual([
      [options.commands[0]],
      [options.commands[1]],
    ]);
  });

  it("contextMenu writes its options and registers items", () => {
    const bare = coreFeatures.contextMenu();
    expect(bare.id).toBe("context-menu");
    expect(patch(bare)).toEqual({ contextMenu: true });
    expect(bare.setup).toBeUndefined();
    expect(coreFeatures.contextMenu({}).setup).toBeUndefined();

    const items = () => [command];
    const made = coreFeatures.contextMenu({ items });
    expect(patch(made)).toEqual({ contextMenu: { items } });
    const host = mockHost();
    made.setup?.(host);
    expect(host.registerContextMenuItems).toHaveBeenCalledExactlyOnceWith(
      items
    );
  });

  it("sidePanel writes its options and registers every panel", () => {
    const panels = [{ key: "columns" }, { key: "filters" }];
    const made = coreFeatures.sidePanel({ panels });
    expect(made.id).toBe("side-panel");
    expect(patch(made)).toEqual({ sidePanel: { panels } });
    const host = mockHost();
    made.setup?.(host);
    expect(host.registerPanel.mock.calls).toEqual([[panels[0]], [panels[1]]]);
  });

  it("filterTypes writes the specs and registers each one", () => {
    const specs = [
      { type: "rating" } as FilterTypeSpec,
      { type: "color" } as FilterTypeSpec,
    ];
    const made = coreFeatures.filterTypes(specs);
    expect(made.id).toBe("filter-types");
    expect(patch(made)).toEqual({ filterTypes: specs });
    const host = mockHost();
    made.setup?.(host);
    expect(host.registerFilterType.mock.calls).toEqual([
      [specs[0]],
      [specs[1]],
    ]);
  });

  it("exportCsv writes its options and registers a custom writer", () => {
    const bare = coreFeatures.exportCsv();
    expect(bare.id).toBe("export-csv");
    expect(patch(bare)).toEqual({ exportCsv: true });
    expect(bare.setup).toBeUndefined();
    expect(coreFeatures.exportCsv({}).setup).toBeUndefined();

    const writer: ExportWriter = {
      extension: "tsv",
      build: () => ({}) as ReturnType<ExportWriter["build"]>,
    };
    const made = coreFeatures.exportCsv({ writer });
    expect(patch(made)).toEqual({ exportCsv: { writer } });
    const host = mockHost();
    made.setup?.(host);
    expect(host.registerWriter).toHaveBeenCalledExactlyOnceWith(writer);
  });
});
