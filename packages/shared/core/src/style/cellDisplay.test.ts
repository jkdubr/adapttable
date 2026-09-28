import { describe, expect, it } from "vitest";

import { PIN_Z } from "../columns/columnLayoutModel";
import {
  cellHighlightKind,
  cellHighlightStyle,
  CURRENT_MATCH_CELL_STYLE,
  groupIndentStyle,
  groupRowParts,
  isCurrentMatchCell,
  isMatchedCell,
  isSelectedCell,
  logicalAlign,
  MATCHED_CELL_STYLE,
  mergedCellStyle,
  pinnedDataCellStyle,
  pinnedEdgeCellStyle,
  resolveMobileLabel,
  SELECTED_CELL_OUTLINE,
  shallowEqualByKeys,
  sortArrow,
} from "./cellDisplay";

describe("logicalAlign", () => {
  it("maps center and end, defaulting to start", () => {
    expect(logicalAlign("center")).toBe("center");
    expect(logicalAlign("end")).toBe("end");
    expect(logicalAlign("start")).toBe("start");
    expect(logicalAlign(undefined)).toBe("start");
  });
});

describe("mergedCellStyle", () => {
  it("centers and fills a span, and stays off for 1×1 or plain", () => {
    expect(mergedCellStyle(1, 1)).toBeUndefined();
    expect(mergedCellStyle(2, 1, "plain")).toBeUndefined();
    const merged = mergedCellStyle(2, 1);
    expect(merged?.textAlign).toBe("center");
    expect(merged?.verticalAlign).toBe("middle");
    expect(merged?.background).toContain("--adapttable-cell-span-fill");
    expect(mergedCellStyle(2, 1, "merged", "off")?.background).toBeUndefined();
    expect(mergedCellStyle(2, 1, "merged", "off")?.textAlign).toBe("center");
  });
});

describe("sortArrow", () => {
  it("returns the ascending, descending, and unsorted glyphs", () => {
    expect(sortArrow("ascending")).toBe(" ↑");
    expect(sortArrow("descending")).toBe(" ↓");
    expect(sortArrow("none")).toBe(" ↕");
    expect(sortArrow(undefined)).toBe(" ↕");
  });
});

describe("pinnedDataCellStyle", () => {
  it("paints the background on a pinned style, passes undefined through", () => {
    const style = pinnedDataCellStyle(
      { side: "start", inset: 0 },
      PIN_Z.body,
      {},
      "navy"
    );
    expect(style?.background).toBe("navy");
    expect(pinnedDataCellStyle(undefined, 0, {}, "navy")).toBeUndefined();
  });
});

describe("pinnedEdgeCellStyle", () => {
  it("styles an active edge cell (+ shift) and skips an inactive one", () => {
    const shifted = pinnedEdgeCellStyle("start", true, PIN_Z.body, "navy", 12);
    expect(shifted?.background).toBe("navy");
    expect(shifted?.insetInlineStart).toBe(12);
    expect(pinnedEdgeCellStyle("start", false, 0, "navy")).toBeUndefined();
  });
});

describe("shallowEqualByKeys", () => {
  it("compares only the listed keys", () => {
    expect(shallowEqualByKeys(["a"], { a: 1, b: 2 }, { a: 1, b: 9 })).toBe(
      true
    );
    expect(shallowEqualByKeys(["a", "b"], { a: 1, b: 2 }, { a: 1, b: 9 })).toBe(
      false
    );
  });
});

describe("resolveMobileLabel", () => {
  it("uses an explicit mobile label over the header", () => {
    expect(
      resolveMobileLabel({ key: "name", header: "Name", mobileLabel: "Who" })
    ).toBe("Who");
  });

  it("treats an empty mobile label as no label at all", () => {
    // The card then shows a bare value — an avatar, a title line — rather than
    // an empty caption line still taking vertical space.
    expect(
      resolveMobileLabel({ key: "name", header: "Name", mobileLabel: "" })
    ).toBeUndefined();
  });

  it("falls back to a text header", () => {
    expect(resolveMobileLabel({ key: "name", header: "Name" })).toBe("Name");
  });

  it("falls back to the key when the header is not text", () => {
    // A JSX header cannot be a caption, and the key is at least the truth.
    expect(resolveMobileLabel({ key: "name", header: 42 })).toBe("name");
  });

  it("falls back to the key when there is no header", () => {
    expect(resolveMobileLabel({ key: "name" })).toBe("name");
  });
});

describe("groupRowParts", () => {
  it("names each of the three rows a grouped body renders", () => {
    expect(groupRowParts("group")).toEqual({
      row: "group-row",
      cell: "group-cell",
      card: "group-card",
      label: "group-label",
    });
    expect(groupRowParts("groupFooter").row).toBe("group-footer-row");
    // A footer still labels itself as a group label — it names the group.
    expect(groupRowParts("groupFooter").label).toBe("group-label");
    expect(groupRowParts("groupMore")).toMatchObject({
      row: "group-more-row",
      label: "group-more-label",
    });
  });
});

describe("groupIndentStyle", () => {
  it("indents deeper levels, logically so RTL mirrors it", () => {
    expect(groupIndentStyle(0)).toEqual({});
    expect(groupIndentStyle(2)).toEqual({ paddingInlineStart: "3rem" });
  });
});

describe("cellHighlightStyle", () => {
  interface Style {
    readonly position?: string;
    readonly background?: string;
    readonly outline?: string;
    readonly outlineOffset?: string;
  }
  const base: Style = { position: "sticky" };
  const selected: Style = { background: "blue" };

  it("returns the kit's own style when nothing highlights the cell", () => {
    expect(cellHighlightStyle({}, base, selected)).toBe(base);
    expect(cellHighlightStyle(undefined, undefined, selected)).toBeUndefined();
  });

  it("paints the find fills over the kit's style", () => {
    expect(
      cellHighlightStyle({ "data-cell-match-current": "" }, base, selected)
    ).toEqual({ ...base, ...CURRENT_MATCH_CELL_STYLE });
    expect(
      cellHighlightStyle({ "data-cell-match": "" }, undefined, selected)
    ).toEqual(MATCHED_CELL_STYLE);
  });

  it("keeps the kit's selection outline, or falls back to core's", () => {
    expect(
      cellHighlightStyle({ "data-cell-selected": "" }, base, selected)
    ).toEqual({ ...base, background: "blue", ...SELECTED_CELL_OUTLINE });
    expect(
      cellHighlightStyle({ "data-cell-selected": "" }, base, {
        ...selected,
        outline: "none",
      })
    ).toEqual({
      ...base,
      background: "blue",
      outline: "none",
      outlineOffset: SELECTED_CELL_OUTLINE.outlineOffset,
    });
  });
});

describe("cellHighlightKind", () => {
  it("leaves an ordinary cell unhighlighted", () => {
    expect(cellHighlightKind({})).toBeUndefined();
    expect(cellHighlightKind(undefined)).toBeUndefined();
  });

  it("puts the current match over other matches, and matches over the selection", () => {
    // The find walk moves the selection with it, so without this order the one
    // cell you were sent to would be the one cell not marked as a hit.
    expect(
      cellHighlightKind({
        "data-cell-match": "",
        "data-cell-match-current": "",
        "data-cell-selected": "",
      })
    ).toBe("current-match");
    expect(
      cellHighlightKind({ "data-cell-match": "", "data-cell-selected": "" })
    ).toBe("match");
    expect(cellHighlightKind({ "data-cell-selected": "" })).toBe("selected");
  });

  it("answers the match questions on their own", () => {
    expect(isMatchedCell({ "data-cell-match": "" })).toBe(true);
    expect(isMatchedCell(undefined)).toBe(false);
    expect(isCurrentMatchCell({ "data-cell-match-current": "" })).toBe(true);
    expect(isCurrentMatchCell({})).toBe(false);
    expect(isSelectedCell({ "data-cell-selected": "" })).toBe(true);
    expect(isSelectedCell(undefined)).toBe(false);
  });
});
