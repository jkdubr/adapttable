import type { ColumnMetadata } from "@adapttable/core";
import {
  resolveColumnDefaults,
  resolveColumnHeaders,
} from "@adapttable/core/binding";

import type { ColumnDef } from "../columnDef";

/**
 * Fill a column's declarative defaults: a missing `header` is the key,
 * humanized, and a column without an `accessor` or a `Cell` reads the row by
 * its locale-resolved data path.
 *
 * @param columns - The declared columns.
 * @param locale - The active locale.
 * @returns The columns, complete ones unchanged.
 *
 * @public
 */
export function resolveColumns<TRow>(
  columns: readonly ColumnDef<TRow>[],
  locale?: string
): ColumnDef<TRow>[] {
  return resolveColumnDefaults<TRow, ColumnDef<TRow>>(
    columns,
    locale,
    (column) => Boolean(column.Cell)
  );
}

/**
 * Neutral columns with the same header default only (no accessor generation).
 *
 * @public
 */
export function resolveNeutralColumnHeaders<TRow>(
  columns: readonly ColumnMetadata<TRow>[]
): ColumnMetadata<TRow>[] {
  return resolveColumnHeaders(columns);
}
