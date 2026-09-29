/**
 * Cell and row editing — `@adapttable/angular-unstyled/editing`.
 *
 * @packageDocumentation
 */
import {
  type AdaptTableFeature,
  type CellEditHandler,
  editing as coreAngularEditing,
  type RowEditHandler,
  rowEditing as coreAngularRowEditing,
} from "@adapttable/angular";

/**
 * Edit a single cell in place. The host's write receives the row, column
 * key and committed value; the table never mutates the array.
 *
 * @param onCellEdit - Called when a draft commits.
 * @param extras - Optional lifecycle observers merged into the patch.
 *
 * @public
 */
export function editing<TRow>(
  onCellEdit: CellEditHandler<TRow>,
  extras: Record<string, unknown> = {}
): AdaptTableFeature {
  return coreAngularEditing(onCellEdit, extras);
}

/**
 * Edit a whole row at once. The host receives one patch of parsed values.
 *
 * @param onRowEdit - Called with the row and its changed fields.
 * @param extras - Optional lifecycle observers merged into the patch.
 *
 * @public
 */
export function rowEditing<TRow>(
  onRowEdit: RowEditHandler<TRow>,
  extras: Record<string, unknown> = {}
): AdaptTableFeature {
  return coreAngularRowEditing(onRowEdit, extras);
}
