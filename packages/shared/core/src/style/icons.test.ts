import { describe, expect, it } from "vitest";

import {
  ASSISTANT_ACTIONS_ICON,
  ASSISTANT_KIND_HUES,
  ASSISTANT_KIND_PATHS,
  assistantKindIcon,
  assistantMicIcon,
  assistantReceiptIcon,
  expandChevronIcon,
  eyeIcon,
  FILTERS_ICON,
  GRIP_ICON,
  type IconShape,
  SEARCH_ICON,
} from "./icons";

const tags = (shapes: readonly IconShape[]) => shapes.map((shape) => shape.tag);

describe("toolbar glyphs", () => {
  it("draws the funnel as one path and the magnifier as a circle and a path", () => {
    expect(tags(FILTERS_ICON.shapes)).toEqual(["path"]);
    expect(tags(SEARCH_ICON.shapes)).toEqual(["circle", "path"]);
    expect(FILTERS_ICON.focusable).toBe("false");
  });

  it("fills the grip's six dots from the glyph", () => {
    expect(tags(GRIP_ICON.shapes)).toEqual(Array(6).fill("circle"));
    expect(GRIP_ICON.fill).toBe("currentColor");
  });
});

describe("expandChevronIcon", () => {
  it("turns by open state and direction", () => {
    expect(expandChevronIcon({ open: false }).style?.transform).toBeUndefined();
    expect(
      expandChevronIcon({ open: false, dir: "rtl" }).style?.transform
    ).toBe("rotate(180deg)");
    expect(expandChevronIcon({ open: true, dir: "rtl" }).style?.transform).toBe(
      "rotate(90deg)"
    );
  });
});

describe("eyeIcon", () => {
  it("adds the slash only for a hidden column", () => {
    expect(eyeIcon().shapes).toHaveLength(2);
    expect(eyeIcon(true).shapes).toHaveLength(3);
  });
});

describe("assistant glyphs", () => {
  it("shows the listening dot only while listening", () => {
    expect(tags(assistantMicIcon().shapes)).toEqual(["rect", "path"]);
    expect(tags(assistantMicIcon(true).shapes)).toEqual([
      "rect",
      "path",
      "circle",
    ]);
  });

  it("gives every kind with a hue a glyph, and no glyph to an unknown kind", () => {
    expect(new Set(Object.keys(ASSISTANT_KIND_HUES))).toEqual(
      new Set(Object.keys(ASSISTANT_KIND_PATHS))
    );
    expect(assistantKindIcon("filter")?.shapes).toEqual([
      { tag: "path", d: ASSISTANT_KIND_PATHS.filter },
    ]);
    expect(assistantKindIcon("nope")).toBeUndefined();
    expect(assistantKindIcon(undefined)).toBeUndefined();
  });

  it("falls back to the operation tile for an unknown kind", () => {
    const known = assistantReceiptIcon("sort");
    expect(known.ink).toBe("oklch(0.58 0.17 150)");
    expect(known.icon.width).toBe("1.3em");
    const unknown = assistantReceiptIcon(undefined);
    expect(unknown.ink).toBe("oklch(0.58 0.17 260)");
    expect(unknown.icon.shapes).toEqual(ASSISTANT_ACTIONS_ICON.shapes);
    expect(assistantReceiptIcon("nope").icon.shapes).toEqual(
      ASSISTANT_ACTIONS_ICON.shapes
    );
  });
});
