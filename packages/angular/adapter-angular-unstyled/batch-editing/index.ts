/**
 * Batch editing — `@adapttable/angular-unstyled/batch-editing`.
 *
 * @packageDocumentation
 */
import {
  type AdaptTableFeature,
  type BatchEditHandler,
  batchEditing as coreAngularBatchEditing,
} from "@adapttable/angular";

/**
 * Collect edits and save them in one batch.
 *
 * @param onBatchEdit - Called with every pending row at once.
 * @param extras - Optional lifecycle observers merged into the patch.
 *
 * @public
 */
export function batchEditing<TRow>(
  onBatchEdit: BatchEditHandler<TRow>,
  extras: Record<string, unknown> = {}
): AdaptTableFeature {
  return coreAngularBatchEditing(onBatchEdit, extras);
}
