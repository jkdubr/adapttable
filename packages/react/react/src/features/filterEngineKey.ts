/**
 * Typed key for the filter engine the filters feature publishes.
 *
 * The shell reads this; it never imports the engine module. A three-prop
 * table sees `undefined` and keeps search/sort/page only. The key lives in
 * `@adapttable/core`, so every binding reads the same id.
 */
export { FILTER_ENGINE } from "@adapttable/core/binding";
