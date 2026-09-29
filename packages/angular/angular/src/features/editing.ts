/**
 * Editing feature factories for Angular: cell, row and batch editing over
 * core's binding factories.
 */
import {
  coreBatchEditing,
  coreEditing,
  coreRowEditing,
} from "@adapttable/core/binding";

import type {
  BatchEditHandler,
  CellEditHandler,
  RowEditHandler,
} from "../editing/editing";
import type { AdaptTableFeature } from "../featureHost";

/**
 * A cell-editing feature that also carries the host's write.
 */
interface EditingFeature<TRow> extends AdaptTableFeature {
  readonly onCellEdit: CellEditHandler<TRow>;
}

/**
 * Edit a single cell in place.
 *
 * @param onCellEdit - The host's write for a committed edit.
 * @param extras - Optional lifecycle observers merged into the feature patch.
 * @returns The feature.
 *
 * @public
 */
export function editing<TRow>(
  onCellEdit: CellEditHandler<TRow>,
  extras: Record<string, unknown> = {}
): AdaptTableFeature {
  return {
    ...coreEditing(onCellEdit, extras),
    onCellEdit,
  } as EditingFeature<TRow>;
}

/**
 * Edit a whole row at once.
 *
 * @param onRowEdit - The host's write for a committed row patch.
 * @param extras - Optional lifecycle observers merged into the feature patch.
 * @returns The feature.
 *
 * @public
 */
export function rowEditing<TRow>(
  onRowEdit: RowEditHandler<TRow>,
  extras: Record<string, unknown> = {}
): AdaptTableFeature {
  return coreRowEditing(onRowEdit, extras);
}

/**
 * Collect edits and save them in one batch.
 *
 * @param onBatchEdit - The host's write for every pending row.
 * @param extras - Optional lifecycle observers merged into the feature patch.
 * @returns The feature.
 *
 * @public
 */
export function batchEditing<TRow>(
  onBatchEdit: BatchEditHandler<TRow>,
  extras: Record<string, unknown> = {}
): AdaptTableFeature {
  return coreBatchEditing(onBatchEdit, extras);
}

export type {
  BatchEditHandler,
  CellEditHandler,
  RowEditHandler,
} from "../editing/editing";
