import { describe, expect, it } from "vitest";

import {
  columnDragAllowed,
  columnDragRowAttrs,
  columnReorderKeyStep,
} from "./columnReorderModel";

const target = (matches: readonly string[]) => ({
  closest: (selector: string) => (matches.includes(selector) ? {} : null),
});

describe("columnDragAllowed", () => {
  it("cancels a drag from a control, but not from the grip or the row", () => {
    expect(columnDragAllowed(null)).toBe(true);
    expect(columnDragAllowed(target([]))).toBe(true);
    expect(columnDragAllowed(target(["button,input,select,a"]))).toBe(false);
    expect(
      columnDragAllowed(
        target(["button,input,select,a", "[data-adapttable-grip]"])
      )
    ).toBe(true);
  });
});

describe("columnReorderKeyStep", () => {
  it("maps the arrows to a step that follows the writing direction", () => {
    expect(columnReorderKeyStep("ArrowLeft", false)).toBe(-1);
    expect(columnReorderKeyStep("ArrowRight", false)).toBe(1);
    expect(columnReorderKeyStep("ArrowRight", true)).toBe(-1);
    expect(columnReorderKeyStep("ArrowLeft", true)).toBe(1);
    expect(columnReorderKeyStep("ArrowUp", true)).toBe(-1);
    expect(columnReorderKeyStep("ArrowDown", false)).toBe(1);
    expect(columnReorderKeyStep("Enter", false)).toBeUndefined();
  });
});

describe("columnDragRowAttrs", () => {
  it("dims the dragged row and marks the edge the column lands on", () => {
    expect(columnDragRowAttrs(null, 1, "a", 1)).toEqual({});
    const drag = { key: "b", from: 2 };
    expect(columnDragRowAttrs(drag, 0, "b", 2)).toEqual({
      "data-dragging": "",
    });
    expect(columnDragRowAttrs(drag, 0, "a", 0)).toEqual({
      "data-drop": "before",
    });
    expect(columnDragRowAttrs(drag, 3, "d", 3)).toEqual({
      "data-drop": "after",
    });
    expect(columnDragRowAttrs(drag, 3, "a", 0)).toEqual({});
  });
});
