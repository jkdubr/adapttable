/**
 * Build the live {@link TableRuntime} Angular Chrome reads from a table and
 * its source.
 */
import {
  type TableRuntime,
  type TableRuntimeView,
  type TableSource,
} from "@adapttable/core";
import { type Signal } from "@angular/core";

import type { DataTable } from "../dataTable";
import type { AdaptTableFeature } from "../featureHost";

/**
 * Build the live {@link TableRuntime} a grouping panel controller reads.
 *
 * @internal
 */
export function tableRuntimeFor<TRow>(
  table: DataTable<TRow>,
  source: Signal<TableSource<TRow>>,
  features: readonly AdaptTableFeature[]
): TableRuntime<TRow> {
  const featureIds = features.map(
    (feature, index) => feature.id ?? `feature-${String(index)}`
  );
  return {
    rowAt: (index) => source().rows[index],
    labels: () => table.labels(),
    featureIds: () => featureIds,
    view: (): TableRuntimeView<TRow> | undefined => {
      const current = source();
      const columns = table.allColumns();
      return {
        rows: current.rows,
        getRowId: (row) => table.rowKey(row),
        rowLabel: (row) => table.rowKey(row),
        groupingState: {
          groupBy: current.groupBy,
          aggregateOverrides: current.groupAggregateOverrides ?? {},
          columnLabel: (key) => {
            const column = columns.find((entry) => entry.key === key);
            return typeof column?.header === "string" ? column.header : key;
          },
          columns,
          setGroupBy: current.setGroupBy,
          initializeGroupBy: current.initializeGroupBy,
          setAggregateOverrides: current.setGroupAggregateOverrides,
        },
        query: {
          page: current.page,
          limit: current.limit,
          total: current.total,
          defaultLimit: current.defaultLimit,
          search: current.search,
          sortBy: current.sortBy,
          sortDir: current.sortDir,
          setPage: current.setPage,
          setLimit: current.setLimit,
          setSearch: current.setSearch,
          setSort: current.setSort,
          extra: current.extra,
          setExtras: current.setExtras,
          clearExtras: current.clearExtras,
        },
      };
    },
  };
}
