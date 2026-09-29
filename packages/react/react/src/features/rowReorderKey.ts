/**
 * The key the row-reorder feature publishes under.
 *
 * It lives apart from the feature so the table's chrome can ask for the state
 * without importing the implementation that produces it. That separation is
 * the whole point: a chrome that imported `useRowReorder` to read its result
 * would put the hook back in every table's graph, which is what the feature
 * exists to avoid.
 */
import {
  type FeatureStateKey,
  ROW_REORDER as NEUTRAL_ROW_REORDER,
} from "@adapttable/core/binding";

import type { RowReorderState } from "../rows/rowReorder";

/**
 * Row-reorder state, published by the `rowReorder()` feature —
 * `@adapttable/core`'s key, carrying React's reorder state.
 *
 * @public
 */
export const ROW_REORDER = NEUTRAL_ROW_REORDER as FeatureStateKey<
  RowReorderState<unknown>
>;
