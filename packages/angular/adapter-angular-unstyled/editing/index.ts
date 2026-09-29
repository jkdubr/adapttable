/**
 * Cell and row editing — `@adapttable/angular-unstyled/editing`.
 *
 * @packageDocumentation
 */
import {
  type AdaptTableFeature,
  type CellEditHandler,
  EDITABLE_CELL,
  editing as coreAngularEditing,
  extendFeature,
  type RowEditHandler,
  rowEditing as coreAngularRowEditing,
  slotRender,
} from "@adapttable/angular";
import { AdaptEditableCell } from "@adapttable/angular-unstyled";

/**
 * Edit a single cell in place. The host's write receives the row, column
 * key and committed value; the table never mutates the array. Fills
 * {@link EDITABLE_CELL} with this kit's native editors.
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
  return extendFeature(coreAngularEditing(onCellEdit, extras), [
    slotRender(EDITABLE_CELL, () => AdaptEditableCell),
  ]);
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
  return extendFeature(coreAngularRowEditing(onRowEdit, extras), [
    slotRender(EDITABLE_CELL, () => AdaptEditableCell),
  ]);
}
