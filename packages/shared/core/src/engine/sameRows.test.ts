import { describe, expect, it } from "vitest";

import { sameRows } from "./sameRows";

describe("sameRows", () => {
  const a = { id: 1 };
  const b = { id: 2 };

  it("is true for the same array or the same rows in a new array", () => {
    const rows = [a, b];
    expect(sameRows(rows, rows)).toBe(true);
    expect(sameRows(rows, [a, b])).toBe(true);
  });

  it("is false when the length or any row differs", () => {
    expect(sameRows([a, b], [a])).toBe(false);
    expect(sameRows([a, b], [a, { id: 2 }])).toBe(false);
  });
});
