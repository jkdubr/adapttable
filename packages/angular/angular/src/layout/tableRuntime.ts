/**
 * Build the live {@link TableRuntime} Angular Chrome reads from a table and
 * its source — published through core's {@link TableRuntimePublisher}, the
 * same path React's chrome extras gate uses.
 */
import {
  type GroupedFlatEntry,
  type TableRuntime,
  type TableSource,
} from "@adapttable/core";
import {
  type RuntimeChromeInput,
  TableRuntimePublisher,
} from "@adapttable/core/binding";
import { type Signal } from "@angular/core";

import type { DataTable } from "../dataTable";
import type { AdaptTableFeature } from "../featureHost";

/**
 * The chrome fields {@link TableRuntimePublisher} needs from an Angular
 * {@link DataTable} and its live source.
 */
function chromeFrom<TRow>(
  table: DataTable<TRow>,
  source: TableSource<TRow>,
  grouping: RuntimeGrouping<TRow> | undefined
): RuntimeChromeInput<TRow> {
  const layout = table.layout();
  return {
    source,
    grouping,
    getRowId: (row) => table.rowKey(row),
    allColumns: table.allColumns(),
    columnLayout: {
      visibleColumns: layout.visibleColumns,
      state: layout.state,
      setHidden: layout.setHidden,
      move: layout.move,
      setOrder: layout.setOrder,
      setPinned: layout.setPinned,
    },
    table: {
      labels: table.labels(),
    },
  };
}

/**
 * The grouped entries a table renders, when grouping is on.
 *
 * @public
 */
export interface RuntimeGrouping<TRow> {
  /** Group headers and leaves in render order. */
  readonly entries: readonly GroupedFlatEntry<TRow>[];
}

/**
 * Build the live {@link TableRuntime} a grouping panel or reorder controller
 * reads. One publisher per call keeps the neutral table stable across updates,
 * matching React's RuntimePublisher. With `grouping`, the rows the runtime
 * reads are the grouped leaves in render order.
 *
 * @internal
 */
export function tableRuntimeFor<TRow>(
  table: DataTable<TRow>,
  source: Signal<TableSource<TRow>>,
  features: readonly AdaptTableFeature[],
  grouping?: Signal<RuntimeGrouping<TRow> | undefined>
): TableRuntime<TRow> {
  const featureIds = features.map(
    (feature, index) => feature.id ?? `feature-${String(index)}`
  );
  const publisher = new TableRuntimePublisher<TRow>();
  const publish = () =>
    publisher.update(chromeFrom(table, source(), grouping?.()), {});
  return {
    rowAt: (index) => {
      const view = publish();
      return (view.visibleRows ?? view.rows)[index];
    },
    labels: () => table.labels(),
    featureIds: () => featureIds,
    view: () => publish(),
  };
}
