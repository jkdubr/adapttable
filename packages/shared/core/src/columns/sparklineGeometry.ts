/**
 * Sparkline geometry: the series a sparkline draws, its bars, its line and
 * area paths inside a fixed box, the accessible summary, and the numbers
 * sort and export read instead of the SVG.
 *
 * A binding draws the SVG elements; the shapes are computed here once, so a
 * bar chart in one binding is the same bar chart in every other.
 */

/**
 * The three marks a sparkline draws.
 *
 * @public
 */
export type SparklineKind = "bar" | "line" | "area";

/**
 * One bar in the bar mark, in SVG user units.
 *
 * @public
 */
export interface SparklineBar {
  /** Left edge. */
  readonly x: number;
  /** Top edge. */
  readonly y: number;
  /** Width. */
  readonly width: number;
  /** Height, at least one unit. */
  readonly height: number;
}

/**
 * One point of the line mark, in SVG user units.
 *
 * @public
 */
export interface SparklinePoint {
  /** Horizontal position. */
  readonly x: number;
  /** Vertical position. */
  readonly y: number;
}

/**
 * A sparkline's width in CSS pixels unless the host says otherwise.
 *
 * @public
 */
export const SPARKLINE_DEFAULT_WIDTH = 80;

/**
 * A sparkline's height in CSS pixels unless the host says otherwise.
 *
 * @public
 */
export const SPARKLINE_DEFAULT_HEIGHT = 28;

const PAD = 2;
const BAR_GAP = 1;

/**
 * Drop NaN / Infinity so a bad point cannot collapse the scale.
 *
 * @param values - The series.
 * @returns The finite values, in order.
 *
 * @public
 */
export function finiteSparklineValues(values: readonly number[]): number[] {
  return values.filter((value) => Number.isFinite(value));
}

function extent(series: readonly number[]): { min: number; max: number } {
  const first = series[0] ?? 0;
  let min = first;
  let max = first;
  for (const value of series) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return { min, max };
}

/**
 * Default accessible summary — numbers only, so it is locale-neutral.
 *
 * @param values - The series.
 * @returns The summary.
 *
 * @public
 */
export function sparklineSummary(values: readonly number[]): string {
  const series = finiteSparklineValues(values);
  if (series.length === 0) return "no values";
  if (series.length === 1) return `1 value, ${String(series[0])}`;
  const { min, max } = extent(series);
  const last = series.at(-1);
  return `${String(series.length)} values, min ${String(min)}, max ${String(max)}, last ${String(last)}`;
}

/**
 * CSV / xlsx fallback — the numbers, not the SVG.
 *
 * @param values - The series.
 * @returns The finite values, comma-separated.
 *
 * @public
 */
export function sparklineExportValue(values: readonly number[]): string {
  return finiteSparklineValues(values).join(", ");
}

/**
 * What a sparkline column sorts by: the latest finite value.
 *
 * @param values - The series.
 * @returns The last finite value, or `undefined` for an empty series.
 *
 * @public
 */
export function sparklineSortValue(
  values: readonly number[]
): number | undefined {
  return finiteSparklineValues(values).at(-1);
}

function scaleY(
  value: number,
  min: number,
  max: number,
  height: number
): number {
  const inner = height - PAD * 2;
  if (min === max) return PAD + inner / 2;
  return PAD + inner * (1 - (value - min) / (max - min));
}

/**
 * The bars of a bar sparkline inside a `width` × `height` box.
 *
 * @param series - Finite values, oldest first.
 * @param width - Box width.
 * @param height - Box height.
 * @returns One bar per value.
 *
 * @public
 */
export function sparklineBars(
  series: readonly number[],
  width: number,
  height: number
): SparklineBar[] {
  if (series.length === 0) return [];
  const { min, max } = extent(series);
  const inner = width - PAD * 2;
  const barWidth = Math.max(
    1,
    (inner - BAR_GAP * (series.length - 1)) / series.length
  );
  const baseline = height - PAD;
  return series.map((value, index) => {
    const x = PAD + index * (barWidth + BAR_GAP);
    const top = scaleY(value, min, max, height);
    return { x, y: top, width: barWidth, height: Math.max(1, baseline - top) };
  });
}

/**
 * The points of a line sparkline inside a `width` × `height` box. A single
 * value sits in the middle.
 *
 * @param series - Finite values, oldest first.
 * @param width - Box width.
 * @param height - Box height.
 * @returns One point per value.
 *
 * @public
 */
export function sparklinePoints(
  series: readonly number[],
  width: number,
  height: number
): SparklinePoint[] {
  if (series.length === 0) return [];
  const { min, max } = extent(series);
  const inner = width - PAD * 2;
  if (series.length === 1) {
    return [{ x: width / 2, y: scaleY(series[0] ?? 0, min, max, height) }];
  }
  return series.map((value, index) => ({
    x: PAD + (inner * index) / (series.length - 1),
    y: scaleY(value, min, max, height),
  }));
}

/**
 * The SVG path of a line sparkline; empty for no values, and a hairline dot
 * for one.
 *
 * @param series - Finite values, oldest first.
 * @param width - Box width.
 * @param height - Box height.
 * @returns The path data.
 *
 * @public
 */
export function sparklineLinePath(
  series: readonly number[],
  width: number,
  height: number
): string {
  const points = sparklinePoints(series, width, height);
  const first = points[0];
  if (first === undefined) return "";
  if (points.length === 1) {
    return `M${String(first.x)} ${String(first.y)} h0.01`;
  }
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${String(point.x)} ${String(point.y)}`
    )
    .join(" ");
}

/**
 * The SVG path of an area sparkline: the line, closed down to the baseline.
 *
 * @param series - Finite values, oldest first.
 * @param width - Box width.
 * @param height - Box height.
 * @returns The path data; empty for no values.
 *
 * @public
 */
export function sparklineAreaPath(
  series: readonly number[],
  width: number,
  height: number
): string {
  const points = sparklinePoints(series, width, height);
  const first = points[0];
  const last = points.at(-1);
  if (first === undefined || last === undefined) return "";
  const baseline = height - PAD;
  return `${sparklineLinePath(series, width, height)} L${String(last.x)} ${String(baseline)} L${String(first.x)} ${String(baseline)} Z`;
}
