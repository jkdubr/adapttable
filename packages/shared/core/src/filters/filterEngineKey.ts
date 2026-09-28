/**
 * Typed key for the filter engine the filters feature publishes.
 *
 * The shell reads this; it never imports the engine module. A three-prop
 * table sees `undefined` and keeps search/sort/page only. Every binding reads
 * the same id.
 */
import { featureStateKey } from "../features/featureKeys";
import type { FilterEngine } from "./filterEngine";

/**
 * Published when `filters()` is composed.
 *
 * @public
 */
export const FILTER_ENGINE = featureStateKey<FilterEngine>("filter-engine");
