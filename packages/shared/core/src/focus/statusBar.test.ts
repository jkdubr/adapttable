/**
 * The status bar's figures and the selection statistics' text.
 */
import { describe, expect, it } from "vitest";

import type { SelectionStats } from "./selectionStats";
import { selectionStatParts, statusBarItems } from "./statusBar";

describe("statusBarItems", () => {
  const notice = {
    kind: "virtualize-paged" as const,
    appearance: "off" as const,
    message: "Virtualization is off",
  };

  it("shows notices even when the strip is off", () => {
    expect(
      statusBarItems({
        enabled: false,
        shown: 10,
        selected: 3,
        notices: [notice],
      })
    ).toEqual([
      {
        key: "virtualize-paged",
        text: "Virtualization is off",
        appearance: "off",
      },
    ]);
    expect(statusBarItems({ enabled: false, shown: 10, selected: 0 })).toEqual(
      []
    );
  });

  it("reads the row range from the pagination arithmetic", () => {
    expect(
      statusBarItems({
        enabled: true,
        shown: 10,
        page: 3,
        limit: 10,
        total: 95,
        selected: 0,
      })
    ).toEqual([{ key: "rows", text: "Showing 21–30 of 95" }]);
    expect(statusBarItems({ enabled: true, shown: 0, selected: 0 })).toEqual([
      { key: "rows", text: "Showing 0–0 of 0" },
    ]);
  });

  it("adds the selected count, localized when labels say so", () => {
    expect(
      statusBarItems({ enabled: true, shown: 4, selected: 2 }).at(-1)
    ).toEqual({ key: "selected", text: "2 selected" });
    expect(
      statusBarItems({
        enabled: true,
        shown: 4,
        selected: 2,
        labels: {
          showing: ({ from, to, total }) =>
            `${String(from)}-${String(to)}/${String(total)}`,
          selectedCount: (count) => `${String(count)} choisis`,
        },
      })
    ).toEqual([
      { key: "rows", text: "1-4/4" },
      { key: "selected", text: "2 choisis" },
    ]);
  });
});

describe("selectionStatParts", () => {
  const stats = (overrides: Partial<SelectionStats> = {}): SelectionStats => ({
    cells: 4,
    numeric: 4,
    sum: 1234.5,
    average: 308.625,
    min: 1,
    max: 1000,
    ...overrides,
  });

  it("describes nothing below two cells", () => {
    expect(selectionStatParts(null)).toBeNull();
    expect(selectionStatParts(stats({ cells: 1 }))).toBeNull();
  });

  it("formats every figure in order", () => {
    expect(selectionStatParts(stats(), undefined, "en-US")).toEqual([
      { key: "count", text: "Count 4" },
      { key: "sum", text: "Sum 1,234.5" },
      { key: "average", text: "Avg 308.625" },
      { key: "min", text: "Min 1" },
      { key: "max", text: "Max 1,000" },
    ]);
  });

  it("drops the numbers a text selection does not have", () => {
    expect(
      selectionStatParts(
        stats({ numeric: 0, sum: null, average: null, min: null, max: null }),
        {
          selectionCount: "N",
          selectionSum: "S",
          selectionAverage: "A",
          selectionMin: "Lo",
          selectionMax: "Hi",
        },
        "en-US"
      )
    ).toEqual([{ key: "count", text: "N 4" }]);
    expect(
      selectionStatParts(
        stats(),
        {
          selectionSum: "S",
          selectionAverage: "A",
          selectionMin: "Lo",
          selectionMax: "Hi",
        },
        "en-US"
      )?.map((part) => part.text)
    ).toEqual(["Count 4", "S 1,234.5", "A 308.625", "Lo 1", "Hi 1,000"]);
  });
});
