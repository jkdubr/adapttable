import { describe, expect, it } from "vitest";

import { cellHighlightStyle } from "./display";

describe("cellHighlightStyle", () => {
  const base = { position: "sticky" as const };
  const selected = { background: "kit-blue" };

  it("leaves an ordinary cell exactly as the kit styled it", () => {
    expect(cellHighlightStyle({}, base, selected)).toBe(base);
  });

  it("uses the kit's own fill for a selected cell", () => {
    expect(
      cellHighlightStyle({ "data-cell-selected": "" }, base, selected)
    ).toEqual({
      ...base,
      background: "kit-blue",
      outline: "2px solid CanvasText",
      outlineOffset: "-2px",
    });
  });

  it("paints a find hit amber, over the kit's selection fill", () => {
    // The find walk moves the selection with it, so without this order the one
    // cell you were sent to would be the one cell not marked as a hit.
    const style = cellHighlightStyle(
      { "data-cell-match": "", "data-cell-selected": "" },
      base,
      selected
    );
    expect(style?.background).toContain("--adapttable-find-match");
    expect(style?.outline).toContain("dashed");
    expect(style?.position).toBe("sticky");
  });

  it("marks the current hit more strongly than the rest", () => {
    const style = cellHighlightStyle(
      { "data-cell-match": "", "data-cell-match-current": "" },
      base,
      selected
    );
    expect(style?.background).toContain("--adapttable-find-match-current");
    expect(style?.outline).toContain("solid");
  });

  it("keeps an outline the kit's selection fill names", () => {
    expect(
      cellHighlightStyle({ "data-cell-selected": "" }, base, {
        background: "kit-blue",
        outline: "1px solid red",
        outlineOffset: "0",
      })
    ).toEqual({
      ...base,
      background: "kit-blue",
      outline: "1px solid red",
      outlineOffset: "0",
    });
  });
});
