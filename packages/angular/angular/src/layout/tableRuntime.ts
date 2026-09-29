/**
 * Build the live {@link TableRuntime} Angular Chrome reads from a table and
 * its source — published through core's {@link TableRuntimePublisher}, the
 * same path React's chrome extras gate uses.
 */
import { type TableRuntime, type TableSource } from "@adapttable/core";
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
  source: TableSource<TRow>
): RuntimeChromeInput<TRow> {
  const layout = table.layout();
  return {
    source,
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
 * Build the live {@link TableRuntime} a grouping panel or reorder controller
 * reads. One publisher per call keeps the neutral table stable across updates,
 * matching React's RuntimePublisher.
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
  const publisher = new TableRuntimePublisher<TRow>();
  const publish = () => publisher.update(chromeFrom(table, source()), {});
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
