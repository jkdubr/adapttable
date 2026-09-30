/**
 * Editing feature factories for Angular: cell, row and batch editing, and
 * the marks on unsaved edits, over core's binding factories.
 */
import type { EditEventHandler } from "@adapttable/core";
import {
  coreBatchEditing,
  coreDirtyIndicators,
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
 * Lifecycle observers a host may pass to {@link editing}.
 *
 * @public
 */
export interface EditingLifecycleExtras<TRow = unknown> {
  /** An editor opened. */
  readonly onEditStart?: EditEventHandler<TRow>;
  /** A commit reached the host. */
  readonly onEditCommit?: EditEventHandler<TRow>;
  /** The reader threw the draft away. */
  readonly onEditCancel?: EditEventHandler<TRow>;
  /** Extra patch fields merged into the feature. */
  readonly [key: string]: unknown;
}

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
 * @param extras - Optional lifecycle observers merged into the feature patch;
 *   {@link injectCellEditing} reads `onEditStart` / `onEditCancel`, and the
 *   editing bundle's lifecycle carries `onEditCommit`.
 * @returns The feature.
 *
 * @public
 */
export function editing<TRow>(
  onCellEdit: CellEditHandler<TRow>,
  extras: EditingLifecycleExtras<TRow> = {}
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

/**
 * Marks on the cells and rows that hold unsaved edits.
 *
 * @returns The feature.
 *
 * @public
 */
export function dirtyIndicators(): AdaptTableFeature {
  return coreDirtyIndicators();
}

export type {
  BatchEditHandler,
  CellEditHandler,
  RowEditHandler,
} from "../editing/editing";
