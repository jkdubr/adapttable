/**
 * Density resolution: which row density a table renders, and where a change
 * request goes.
 *
 * A controlled `density` wins; otherwise a composed density chooser owns the
 * value; otherwise the table is comfortable. A change updates the chooser's
 * own value only while uncontrolled — a controlled table waits for its prop —
 * and the host's callback observes every request in either mode.
 */
import type { TableDensity } from "../url/viewStateSlices";

/**
 * The density a table renders when nothing chose one.
 *
 * @public
 */
export const DEFAULT_DENSITY: TableDensity = "comfortable";

/**
 * The density a table renders.
 *
 * @param controlled - The host's controlled value, if any.
 * @param featureOwned - The density chooser's own value, when one is composed.
 * @returns The density.
 *
 * @public
 */
export function resolveDensity(
  controlled: TableDensity | undefined,
  featureOwned: TableDensity | undefined
): TableDensity {
  return controlled ?? featureOwned ?? DEFAULT_DENSITY;
}

/**
 * Route a density change request.
 *
 * @param next - The requested density.
 * @param route - Whether the table is controlled, the chooser's setter when
 *   one is composed, and the host's observer.
 *
 * @public
 */
export function requestDensityChange(
  next: TableDensity,
  route: {
    readonly controlled: boolean;
    readonly setFeatureDensity?: (next: TableDensity) => void;
    readonly onDensityChange?: (next: TableDensity) => void;
  }
): void {
  if (!route.controlled) route.setFeatureDensity?.(next);
  route.onDensityChange?.(next);
}
