/**
 * Excel-style checklist filter — distinct values, counts, search,
 * select-all. Prefers {@link TableSource.facets} (own-filter excluded);
 * falls back to {@link TableSource.allFilteredRows}. A server page that
 * omits both does not offer the widget.
 */
import {
  CHECKLIST_VIRTUALIZE_AT,
  checklistActions,
  checklistItems,
  type ChecklistValue,
  type FilterDef,
  listFilterValues,
  searchChecklistItems,
  type TableSource,
} from "@adapttable/core";
import { useMemo, useState } from "react";

export type { ChecklistValue } from "@adapttable/core";
export {
  CHECKLIST_ITEM_HEIGHT,
  CHECKLIST_LIST_HEIGHT,
  CHECKLIST_VIRTUALIZE_AT,
} from "@adapttable/core";

/**
 * Kit-agnostic state behind {@link useChecklistFilter}.
 *
 * @public
 */
export interface ChecklistFilterState {
  /** False when the source has no full filtered set — do not render. */
  available: boolean;
  /** Distinct values, selected-but-missing ones included at count 0. */
  items: readonly ChecklistValue[];
  /** `items` narrowed by the search box. */
  visible: readonly ChecklistValue[];
  /** Current search box text. */
  query: string;
  /** Replaces the checklist's search text. */
  setQuery: (next: string) => void;
  /** Currently checked values. */
  selected: readonly string[];
  /** True when `visible` is long enough to window. */
  virtualize: boolean;
  /** Checks every option the search left visible. */
  selectAllVisible: () => void;
  /** Unchecks every option. */
  clear: () => void;
  /** Checks or unchecks one option. */
  toggle: (value: string, on: boolean) => void;
}

export { collectChecklistValues } from "@adapttable/core";

/**
 * Derive the checklist from `source.facets` or `source.allFilteredRows`.
 * Returns `available: false` when both are missing so a server page
 * never pretends it can count a set it does not hold.
 *
 * @public
 */
export function useChecklistFilter<TRow>(
  def: FilterDef<TRow>,
  source: Pick<
    TableSource<TRow>,
    "allFilteredRows" | "extra" | "setExtra" | "facets"
  >
): ChecklistFilterState {
  const fromFacets = source.facets?.[def.key];
  const rows = source.allFilteredRows;
  const raw = source.extra[def.key];
  const { available, items } = useMemo(
    () =>
      checklistItems(def, {
        facets: fromFacets ? { [def.key]: fromFacets } : undefined,
        allFilteredRows: rows,
        extra: { [def.key]: raw },
      }),
    [def, rows, raw, fromFacets]
  );
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () => searchChecklistItems(items, query),
    [items, query]
  );
  return {
    available,
    items,
    visible,
    query,
    setQuery,
    selected: listFilterValues(raw),
    virtualize: visible.length >= CHECKLIST_VIRTUALIZE_AT,
    ...checklistActions(def, source, visible),
  };
}
