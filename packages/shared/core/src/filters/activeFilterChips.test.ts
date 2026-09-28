import { describe, expect, it, vi } from "vitest";

import {
  activeFilterChips,
  chipValuesOf,
  mergeFilterChips,
  resolveActiveFilterCount,
} from "./activeFilterChips";

const chip = (key: string) => ({ key, label: key, onRemove: vi.fn() });

describe("mergeFilterChips", () => {
  it("returns an input unchanged when the other is empty", () => {
    const own = [chip("a")];
    const extra = [chip("b")];
    expect(mergeFilterChips(own, undefined)).toBe(own);
    expect(mergeFilterChips(own, [])).toBe(own);
    expect(mergeFilterChips([], extra)).toBe(extra);
    expect(mergeFilterChips(own, extra).map((c) => c.key)).toEqual(["a", "b"]);
  });
});

describe("resolveActiveFilterCount", () => {
  it("prefers a positive override", () => {
    expect(resolveActiveFilterCount(4, 1)).toBe(4);
    expect(resolveActiveFilterCount(0, 1)).toBe(1);
    expect(resolveActiveFilterCount(undefined, 2)).toBe(2);
  });
});

describe("activeFilterChips", () => {
  it("makes a chip per list entry and one per scalar, skipping the rest", () => {
    const onChange = vi.fn();
    const chips = activeFilterChips({
      values: {
        tags: ["a", "b"],
        q: "x",
        empty: "",
        gone: undefined,
        valueOf: "crafted",
        blank: "y",
      },
      labels: {
        tags: (value) => `Tag ${value}`,
        q: (value) => `Q ${value}`,
        empty: () => "E",
        gone: () => "G",
        blank: () => "",
      },
      onChange,
    });
    expect(chips.map((c) => [c.key, c.label])).toEqual([
      ["tags:a", "Tag a"],
      ["tags:b", "Tag b"],
      ["q:x", "Q x"],
    ]);
    chips[0]!.onRemove();
    expect(onChange).toHaveBeenLastCalledWith("tags", ["b"]);
    chips[2]!.onRemove();
    expect(onChange).toHaveBeenLastCalledWith("q", undefined);
    activeFilterChips({
      values: { tags: ["a"] },
      labels: { tags: (value) => value },
      onChange,
    })[0]!.onRemove();
    expect(onChange).toHaveBeenLastCalledWith("tags", undefined);
  });
});

describe("chipValuesOf", () => {
  it("keeps labeled keys with a value", () => {
    expect(
      chipValuesOf(
        { a: "1", b: "", c: [], d: ["x"], e: "unlabeled", f: undefined },
        { a: String, b: String, c: String, d: String, f: String }
      )
    ).toEqual({ a: "1", d: ["x"] });
  });
});
