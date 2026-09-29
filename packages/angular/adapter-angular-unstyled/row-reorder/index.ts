/**
 * Row drag/keyboard reorder — `@adapttable/angular-unstyled/row-reorder`.
 *
 * @packageDocumentation
 */
import {
  type AdaptTableFeature,
  rowReorder as coreAngularRowReorder,
  type RowReorderHandler,
  type RowReorderOptions,
} from "@adapttable/angular";

/**
 * Let rows be dragged, or moved with the keyboard, into a new order. The
 * table never writes to the host's array — the handler applies the move.
 *
 * @param onRowReorder - Called with the from/to indexes and the moved row.
 * @param options - Move policy and cross-boundary handlers.
 *
 * @public
 */
export function rowReorder<TRow>(
  onRowReorder: RowReorderHandler<TRow>,
  options?: RowReorderOptions<TRow>
): AdaptTableFeature {
  return coreAngularRowReorder(onRowReorder, options);
}
