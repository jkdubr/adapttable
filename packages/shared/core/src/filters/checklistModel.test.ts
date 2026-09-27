import { describe, expect, it, vi } from "vitest";

import {
  CHECKLIST_ITEM_HEIGHT,
  CHECKLIST_ITEM_WIDTH,
  CHECKLIST_LIST_HEIGHT,
  CHECKLIST_OPTION_GAP,
  checklistActions,
  checklistColumnsAcross as columnsAcross,
  checklistItems,
  checklistWindow,
  searchChecklistItems,
} from "./checklistModel";
import type { FilterDef } from "./filterDefs";

const ROW_HEIGHT = CHECKLIST_ITEM_HEIGHT + CHECKLIST_OPTION_GAP;

/** Container width that fits exactly `columns` option cells. */
function widthFor(columns: number): number {
  return columns * CHECKLIST_ITEM_WIDTH + (columns - 1) * CHECKLIST_OPTION_GAP;
}

describe("columnsAcross", () => {
  it("assumes one per row before anything is measured", () => {
    expect(columnsAcross(0)).toBe(1);
    expect(columnsAcross(-10)).toBe(1);
  });

  it("counts whole cells, gaps included", () => {
    expect(columnsAcross(widthFor(1))).toBe(1);
    expect(columnsAcross(widthFor(3))).toBe(3);
    // One pixel short of a fourth cell is still three.
    expect(columnsAcross(widthFor(4) - 1)).toBe(3);
  });

  it("never returns zero for a container narrower than one cell", () => {
    expect(columnsAcross(CHECKLIST_ITEM_WIDTH - 50)).toBe(1);
  });
});

describe("checklistWindow", () => {
  it("starts at the top with a spacer holding the rest open", () => {
    const window = checklistWindow(200, 0, 0);
    expect(window.start).toBe(0);
    expect(window.padTop).toBe(0);
    expect(window.end).toBeLessThan(200);
    expect(window.padBottom).toBeGreaterThan(0);
  });

  it("mounts a window of fixed size, not the whole list", () => {
    const visibleRows = Math.ceil(CHECKLIST_LIST_HEIGHT / ROW_HEIGHT);
    // The window is always the same number of rows — the viewport plus two
    // rows of overscan each side — so the mounted count does not jump around
    // as the reader scrolls. At the top the leading overscan is simply
    // clamped away, it is not rendered above the first row.
    const rows = visibleRows + 4;
    expect(checklistWindow(200, 0, 0).end).toBe(rows);
    expect(checklistWindow(200, 20 * ROW_HEIGHT, 0)).toMatchObject({
      start: 18,
      end: 18 + rows,
    });
  });

  it("moves the window and the spacers as the list scrolls", () => {
    const window = checklistWindow(200, 20 * ROW_HEIGHT, 0);
    expect(window.start).toBe(18);
    expect(window.padTop).toBe(18 * ROW_HEIGHT);
    expect(window.end).toBeGreaterThan(window.start);
    expect(window.padBottom).toBeGreaterThan(0);
  });

  it("counts rows of options, not options, once several fit across", () => {
    const width = widthFor(4);
    const window = checklistWindow(200, 0, width);
    // 200 options in rows of four: the window covers four times the rows.
    expect(window.end).toBe(checklistWindow(200, 0, 0).end * 4);
  });

  it("clamps to the end of the list instead of scrolling past it", () => {
    const window = checklistWindow(60, 10_000, 0);
    expect(window.end).toBe(60);
    expect(window.padBottom).toBe(0);
    expect(window.start).toBeGreaterThan(0);
  });

  it("holds a list shorter than the viewport whole", () => {
    const window = checklistWindow(3, 0, 0);
    expect(window).toEqual({ start: 0, end: 3, padTop: 0, padBottom: 0 });
  });
});

interface Row {
  status: string;
}
const def: FilterDef<Row> = {
  key: "status",
  type: "multiSelect",
  getValue: (row) => row.status,
};

describe("checklistItems", () => {
  it("prefers the source's facets", () => {
    const facets = { status: [{ value: "a", label: "A", count: 2 }] };
    expect(checklistItems(def, { extra: {}, facets })).toEqual({
      available: true,
      items: facets.status,
    });
  });

  it("counts the filtered rows, keeping a selected value that is gone", () => {
    const { available, items } = checklistItems(def, {
      extra: { status: ["gone"] },
      allFilteredRows: [{ status: "open" }, { status: "open" }],
    });
    expect(available).toBe(true);
    expect(items.map((item) => [item.value, item.count])).toEqual(
      expect.arrayContaining([
        ["open", 2],
        ["gone", 0],
      ])
    );
  });

  it("offers nothing when the source holds neither", () => {
    expect(checklistItems(def, { extra: {} })).toEqual({
      available: false,
      items: [],
    });
  });
});

describe("searchChecklistItems", () => {
  const items = [
    { value: "ny", label: "New York", count: 1 },
    { value: "la", label: "Los Angeles", count: 1 },
  ];

  it("matches label or value, ignoring case and space", () => {
    expect(searchChecklistItems(items, "  ")).toBe(items);
    expect(searchChecklistItems(items, " YORK").map((i) => i.value)).toEqual([
      "ny",
    ]);
    expect(searchChecklistItems(items, "la").map((i) => i.value)).toEqual([
      "la",
    ]);
  });
});

describe("checklistActions", () => {
  const visible = [
    { value: "a", label: "A", count: 1 },
    { value: "b", label: "B", count: 1 },
  ];

  it("selects every visible option, keeping the checked ones", () => {
    const setExtra = vi.fn();
    checklistActions(
      def,
      { extra: { status: ["z"] }, setExtra },
      visible
    ).selectAllVisible();
    expect(setExtra).toHaveBeenCalledWith("status", ["z", "a", "b"]);
  });

  it("toggles one option and clears the filter once none is checked", () => {
    const setExtra = vi.fn();
    const actions = checklistActions(
      def,
      { extra: { status: "a" }, setExtra },
      visible
    );
    actions.toggle("a", true);
    expect(setExtra).toHaveBeenLastCalledWith("status", ["a"]);
    actions.toggle("b", true);
    expect(setExtra).toHaveBeenLastCalledWith("status", ["a", "b"]);
    actions.toggle("a", false);
    expect(setExtra).toHaveBeenLastCalledWith("status", undefined);
    actions.clear();
    expect(setExtra).toHaveBeenLastCalledWith("status", undefined);
  });
});
