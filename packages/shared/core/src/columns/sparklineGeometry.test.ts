/**
 * Sparkline geometry: the series, the summary, and the shapes in the box.
 */
import { describe, expect, it } from "vitest";

import {
  finiteSparklineValues,
  SPARKLINE_DEFAULT_HEIGHT,
  SPARKLINE_DEFAULT_WIDTH,
  sparklineAreaPath,
  sparklineBars,
  sparklineExportValue,
  sparklineLinePath,
  sparklinePoints,
  sparklineSortValue,
  sparklineSummary,
} from "./sparklineGeometry";

describe("sparkline values", () => {
  it("drops non-finite points", () => {
    expect(finiteSparklineValues([1, Number.NaN, 2, Infinity])).toEqual([1, 2]);
  });

  it("summarizes the series in numbers", () => {
    expect(sparklineSummary([])).toBe("no values");
    expect(sparklineSummary([4])).toBe("1 value, 4");
    expect(sparklineSummary([3, 1, 5, 2])).toBe(
      "4 values, min 1, max 5, last 2"
    );
  });

  it("exports and sorts by the numbers", () => {
    expect(sparklineExportValue([1, Number.NaN, 2])).toBe("1, 2");
    expect(sparklineSortValue([1, 2, Number.NaN])).toBe(2);
    expect(sparklineSortValue([])).toBeUndefined();
    expect(SPARKLINE_DEFAULT_WIDTH).toBe(80);
    expect(SPARKLINE_DEFAULT_HEIGHT).toBe(28);
  });
});

describe("sparkline shapes", () => {
  it("draws nothing for no values", () => {
    expect(sparklineBars([], 80, 28)).toEqual([]);
    expect(sparklinePoints([], 80, 28)).toEqual([]);
    expect(sparklineLinePath([], 80, 28)).toBe("");
    expect(sparklineAreaPath([], 80, 28)).toBe("");
  });

  it("lays bars side by side down to the baseline", () => {
    const bars = sparklineBars([0, 10], 22, 24);
    expect(bars).toEqual([
      { x: 2, y: 22, width: 8.5, height: 1 },
      { x: 11.5, y: 2, width: 8.5, height: 20 },
    ]);
    expect(sparklineBars([5, 5, 5], 4, 10)[0]?.width).toBe(1);
  });

  it("centres a flat or single series", () => {
    expect(sparklinePoints([7], 80, 28)).toEqual([{ x: 40, y: 14 }]);
    expect(sparklinePoints([3, 3], 24, 28).map((point) => point.y)).toEqual([
      14, 14,
    ]);
    expect(sparklineLinePath([7], 80, 28)).toBe("M40 14 h0.01");
  });

  it("draws the line and closes the area to the baseline", () => {
    expect(sparklineLinePath([0, 10], 24, 24)).toBe("M2 22 L22 2");
    expect(sparklineAreaPath([0, 10], 24, 24)).toBe(
      "M2 22 L22 2 L22 22 L2 22 Z"
    );
  });
});
