import { afterEach, describe, expect, it, vi } from "vitest";

import type { FilterDef, FilterRuntime } from "../filters/filterDefs";
import type { FilterEngine } from "../filters/filterEngine";
import type { FilterTypeRegistry } from "../filters/filterRegistry";
import { resetDevWarnings } from "../utils/devWarn";
import type { TableQueryListener } from "./dataTier";
import { createTableData, type TableDataConfig } from "./tableData";
import type { TableSource } from "./TableSource";

interface Row {
  id: string;
  team: string;
}

const ROWS: Row[] = [
  { id: "a", team: "x" },
  { id: "b", team: "y" },
];

const COLUMNS: TableDataConfig<Row>["columns"] = [];

const REGISTRY: FilterTypeRegistry = {
  get: (type) =>
    type === "tags" ? ({ type, widget: "checklist" } as never) : undefined,
  has: () => true,
  types: () => [],
};

const DEFS = [
  { key: "team", type: "checklist" },
  { key: "labels", type: "tags" },
  { key: "name", type: "text" },
] as unknown as FilterDef<Row>[];

/** An engine whose runtime keeps rows on team `x`. */
function engineStub(): FilterEngine & {
  loads: (() => Promise<readonly { value: string; label: string }[]>)[];
} {
  const loads: (() => Promise<readonly { value: string; label: string }[]>)[] =
    [];
  return {
    loads,
    buildRuntime: vi.fn((input) => {
      const runtime: FilterRuntime<Row> = {
        defs: [
          ...DEFS,
          {
            key: "owner",
            type: "text",
            options: () => Promise.resolve([{ value: "o", label: "O" }]),
          },
        ],
        numberExtraKeys: [],
        filterLabels: {},
        arrayExtraKeys: Object.keys(input.loadedOptions),
        filterFn: (row: Row) => row.team === "x",
        registry: REGISTRY,
      };
      return runtime as never;
    }),
    evaluateTree: vi.fn(() => true),
    computeFacets: vi.fn((_defs, rows, extra, keep) => ({
      team: rows
        .filter((row: Row) => keep(row, extra))
        .map((row: Row) => ({ value: row.id, label: row.id, count: 1 })),
    })),
  } as never;
}

function config(
  overrides: Partial<TableDataConfig<Row>> = {}
): TableDataConfig<Row> {
  return {
    engine: undefined,
    data: ROWS,
    columns: COLUMNS,
    ...overrides,
  };
}

function sourceOf(overrides: Partial<TableSource<Row>> = {}): TableSource<Row> {
  return {
    rows: ROWS,
    total: 2,
    page: 1,
    limit: 10,
    search: "",
    extra: {},
    allSearchedRows: ROWS,
    ...overrides,
  } as TableSource<Row>;
}

afterEach(() => {
  vi.restoreAllMocks();
  resetDevWarnings();
});

describe("createTableData", () => {
  it("resolves the tier and runs without a filter engine", () => {
    const table = createTableData<Row>();
    const plan = table.plan(config());
    expect(plan.tier).toBe("frontend");
    expect(plan.runtime.defs).toEqual([]);
    expect(plan.runtime.registry.get("x")).toBeUndefined();
    expect(plan.runtime.registry.has("x")).toBe(false);
    expect(plan.runtime.registry.types()).toEqual([]);
    expect(plan.filterFn(ROWS[1]!, {})).toBe(true);
    expect(plan.filterTreeFn).toBeUndefined();
    expect(plan.facetKeys).toBeUndefined();
    expect(table.plan(config({ onQueryChange: vi.fn() })).tier).toBe("server");

    const resolved = sourceOf();
    expect(table.finish({ resolved, frontend: resolved })).toBe(resolved);
    const release = table.loadOptions();
    release();
  });

  it("does nothing before a plan", () => {
    const table = createTableData<Row>();
    const resolved = sourceOf();
    expect(table.finish({ resolved, frontend: resolved })).toBe(resolved);
    table.commit();
    table.loadOptions()();
  });

  it("builds the runtime once per input and ANDs the host's predicate", () => {
    const engine = engineStub();
    const table = createTableData<Row>();
    const hostFilter = (row: Row) => row.id === "a";
    const first = table.plan(config({ engine, filterFn: hostFilter }));
    const again = table.plan(config({ engine, filterFn: hostFilter }));
    expect(again.runtime).toBe(first.runtime);
    expect(again.filterFn).toBe(first.filterFn);
    expect(engine.buildRuntime).toHaveBeenCalledTimes(1);
    expect(first.filterFn(ROWS[0]!, {})).toBe(true);
    expect(first.filterFn(ROWS[1]!, {})).toBe(false);

    const tree = { combinator: "and" as const, conditions: [] };
    expect(first.filterTreeFn?.(ROWS[0]!, tree)).toBe(true);
    expect(engine.evaluateTree).toHaveBeenCalledWith(
      tree,
      ROWS[0],
      first.runtime.defs,
      REGISTRY
    );
  });

  it("asks the server for every checklist filter unless told which", () => {
    const engine = engineStub();
    const table = createTableData<Row>();
    expect(table.plan(config({ engine })).facetKeys).toEqual([
      "team",
      "labels",
    ]);
    expect(
      table.plan(config({ engine, facetKeys: ["name"] })).facetKeys
    ).toEqual(["name"]);
  });

  it("computes facets from the searched rows when nothing answered them", () => {
    const engine = engineStub();
    const table = createTableData<Row>();
    table.plan(config({ engine }));
    const resolved = sourceOf({
      filterTree: { combinator: "and", conditions: [] },
    });
    const finished = table.finish({ resolved, frontend: resolved });
    expect(finished.facets).toEqual({
      team: [{ value: "a", label: "a", count: 1 }],
    });
    expect(engine.evaluateTree).toHaveBeenCalled();
    // The same source reads the same result.
    expect(table.finish({ resolved, frontend: resolved })).toBe(finished);

    const untreed = sourceOf();
    expect(
      table.finish({ resolved: untreed, frontend: untreed }).facets
    ).toEqual({ team: [{ value: "a", label: "a", count: 1 }] });

    const answered = sourceOf({ facets: { team: [] } });
    expect(
      table.finish({ resolved: answered, frontend: answered }).facets
    ).toBe(answered.facets);
    const rowless = sourceOf({ allSearchedRows: undefined });
    expect(table.finish({ resolved: rowless, frontend: rowless })).toBe(
      rowless
    );
  });

  it("loads each filter's own options once and re-plans with them", async () => {
    const engine = engineStub();
    const table = createTableData<Row>();
    const listener = vi.fn();
    const unsubscribe = table.subscribe(listener);
    table.plan(config({ engine }));
    const release = table.loadOptions();
    await Promise.resolve();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(table.revision()).toBe(1);
    const replanned = table.plan(config({ engine }));
    expect(replanned.runtime.arrayExtraKeys).toEqual(["owner"]);
    release();
    unsubscribe();
  });

  describe("frontend change notices", () => {
    it("tells a frontend table about each change, not the mount", () => {
      const listener = vi.fn<TableQueryListener>();
      const table = createTableData<Row>();
      const view = sourceOf();
      const frontendMode = config({
        mode: "frontend",
        onQueryChange: listener,
      });

      table.plan(frontendMode);
      table.finish({ resolved: view, frontend: view });
      table.commit();
      expect(listener).not.toHaveBeenCalled();

      const paged = sourceOf({ page: 2 });
      table.plan(frontendMode);
      table.finish({ resolved: paged, frontend: paged });
      table.commit();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]?.[0]).toMatchObject({
        page: 2,
        sortLevels: [],
      });

      const third = sourceOf({ page: 3 });
      table.plan(frontendMode);
      table.finish({ resolved: third, frontend: third });
      table.commit();
      expect(listener.mock.calls[0]?.[1].signal.aborted).toBe(true);

      table.dispose();
      expect(listener.mock.calls[1]?.[1].signal.aborted).toBe(true);
      table.dispose();
    });

    it("stays quiet unless the mode is explicitly frontend", () => {
      const listener = vi.fn<TableQueryListener>();
      const table = createTableData<Row>();
      table.plan(config({ onQueryChange: listener }));
      table.finish({ resolved: sourceOf(), frontend: sourceOf() });
      table.commit();
      table.plan(config({ onQueryChange: listener }));
      const moved = sourceOf({ page: 2 });
      table.finish({ resolved: moved, frontend: moved });
      table.commit();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
