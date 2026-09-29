/**
 * CSV export — `@adapttable/angular-unstyled/export`.
 *
 * @packageDocumentation
 */
import {
  type AdaptTableFeature,
  coreExportCsv,
  type ExportCsvOptions,
  extendFeature,
  slotRender,
  TOOLBAR_EXTRAS,
} from "@adapttable/angular";
import { AdaptExportButton } from "@adapttable/angular-unstyled";

/**
 * CSV export of the current view, from a toolbar button.
 *
 * @param options - `true`, or the export's scope, columns, filename,
 *   writer and hooks.
 *
 * @public
 */
export function exportCsv<TRow>(
  options: boolean | ExportCsvOptions<TRow> = true
): AdaptTableFeature {
  return extendFeature(
    coreExportCsv(options as Parameters<typeof coreExportCsv>[0]),
    [
      slotRender(TOOLBAR_EXTRAS, () => AdaptExportButton, {
        orderAs: "export-csv",
      }),
    ]
  );
}
