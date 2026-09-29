/**
 * The state seam between the optional density feature and the base shell.
 *
 * The key lives outside the feature implementation so a binding's shell can
 * read a composed chooser without importing its provider or state hook.
 */
import { featureStateKey } from "../features/featureKeys";
import type { TableDensity } from "../url/viewStateSlices";

/**
 * State owned by a composed density chooser.
 *
 * @public
 */
export interface DensityFeatureState {
  /** The chooser's uncontrolled value. */
  readonly density: TableDensity;
  /** Update the chooser's uncontrolled value. */
  readonly setDensity: (next: TableDensity) => void;
}

/**
 * Feature-state key for the density chooser. Published only while the density
 * chooser feature is composed.
 *
 * @public
 */
export const DENSITY_STATE =
  featureStateKey<DensityFeatureState>("density-chooser");

/**
 * The density and request channel every adapter renders.
 *
 * @public
 */
export interface ResolvedDensity {
  /** Controlled value, feature-owned value, or the comfortable default. */
  readonly density: TableDensity;
  /** Request a change; controlled tables wait for their prop to update. */
  readonly onDensityChange: (next: TableDensity) => void;
}
