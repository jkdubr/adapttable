import { describe, expect, it } from "vitest";

import {
  type CoreStandardFeatureFactories,
  standardFeatureList,
} from "./standardPreset";

type Made = readonly [string, unknown?];

const factories: CoreStandardFeatureFactories<Made, string, string, object> = {
  columnMenu: () => ["columnMenu"],
  densityChooser: () => ["densityChooser"],
  exportCsv: () => ["exportCsv"],
  findInTable: (options) => ["findInTable", options],
  fitColumns: () => ["fitColumns"],
  fullscreen: () => ["fullscreen"],
  headerFilters: () => ["headerFilters"],
  multiSort: () => ["multiSort"],
  resizableColumns: () => ["resizableColumns"],
  statusBar: () => ["statusBar"],
  grouping: (groupBy) => ["grouping", groupBy],
  bulkActions: (actions) => ["bulkActions", actions],
  filters: (defs) => ["filters", defs],
  savedViews: (options) => ["savedViews", options],
};

const zeroConfig: Made[] = [
  ["columnMenu"],
  ["densityChooser"],
  ["exportCsv"],
  ["findInTable", {}],
  ["fitColumns"],
  ["fullscreen"],
  ["headerFilters"],
  ["multiSort"],
  ["resizableColumns"],
  ["statusBar"],
];

describe("standardFeatureList", () => {
  it("lists the zero-configuration members in a fixed order", () => {
    expect(standardFeatureList(factories)).toEqual(zeroConfig);
    expect(standardFeatureList(factories, {})).toEqual(zeroConfig);
  });

  it("draws the Find button only when findButton is true", () => {
    const findOf = (findButton?: boolean) =>
      standardFeatureList(factories, { findButton }).find(
        ([name]) => name === "findInTable"
      );
    expect(findOf(true)).toEqual(["findInTable", { button: true }]);
    expect(findOf(false)).toEqual(["findInTable", {}]);
    expect(findOf()).toEqual(["findInTable", {}]);
  });

  it("appends each configured member after the fixed ones, in order", () => {
    const views = { storageKey: "v" };
    expect(
      standardFeatureList(factories, {
        savedViews: views,
        filters: ["status"],
        bulkActions: ["archive"],
        grouping: ["team", "role"],
      })
    ).toEqual([
      ...zeroConfig,
      ["grouping", ["team", "role"]],
      ["bulkActions", ["archive"]],
      ["filters", ["status"]],
      ["savedViews", views],
    ]);
  });

  it("adds only the configured members that were named", () => {
    expect(standardFeatureList(factories, { grouping: "team" })).toEqual([
      ...zeroConfig,
      ["grouping", "team"],
    ]);
    expect(standardFeatureList(factories, { filters: [] })).toEqual([
      ...zeroConfig,
      ["filters", []],
    ]);
  });
});
