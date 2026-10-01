/**
 * The Export button's click handler, for CSV and for the XLSX and PDF writers.
 *
 * Core's export controller owns the run. This subscribes to it, abandons the
 * run on destroy, and derives the caption, the announcement and the progress
 * surface every kit renders.
 */
import {
  type ColumnMetadata,
  createExportController,
  exportButtonLabel,
  type ExportCsvOptions,
  type ExportRunHandler,
  type ExportWriter,
  makeExportCsvHandler,
  resolveExportAnnouncement,
  resolveExportCsv,
  resolveExportDisabledReason,
  resolveExportProgressState,
  type TableLabels,
  type TableSource,
} from "@adapttable/core";
import {
  coreExportCsv,
  type ExportHandlerState,
  type FeatureHostState,
} from "@adapttable/core/binding";
import { pdfWriter } from "@adapttable/core/pdf";
import { xlsxWriter } from "@adapttable/core/xlsx";
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  inject,
  Injector,
  type Signal,
} from "@angular/core";

import type { AdaptTableFeature } from "../featureHost";
import { fromStore } from "../store";

/**
 * Options for {@link injectExportHandler}.
 *
 * @public
 */
export interface ExportCsvHandlerOptions<TRow> {
  /** The export configuration, from `exportCsv(...)`, `exportXlsx(...)` or `exportPdf(...)`. */
  readonly exportCsv: boolean | ExportCsvOptions<TRow>;
  /** The table's source. */
  readonly source: Signal<TableSource<TRow>>;
  /** The columns the export writes, in order. */
  readonly columns: Signal<readonly ColumnMetadata<TRow>[]>;
  /** Resolved labels. */
  readonly labels: Signal<Required<TableLabels>>;
  /** The table's feature host, for writers features register. */
  readonly featureHost?: FeatureHostState;
  /** The injector to run in. Omit inside an injection context. */
  readonly injector?: Injector;
}

/**
 * One export run: the button's handler, whether it is busy, what it
 * announces and its label. CSV, XLSX and PDF share it; the writer's
 * extension is the caption.
 *
 * @param options - See {@link ExportCsvHandlerOptions}.
 * @returns The state a toolbar's Export button reads.
 *
 * @public
 */
export function injectExportHandler<TRow>(
  options: ExportCsvHandlerOptions<TRow>
): Signal<ExportHandlerState> {
  if (!options.injector) assertInInjectionContext(injectExportHandler);
  const injector = options.injector ?? inject(Injector);
  const resolved = resolveExportCsv(options.exportCsv, options.featureHost);
  const format = resolved?.writer?.extension ?? "csv";
  const serverBuilt =
    resolved?.scope === "all" && resolved.onExportAll !== undefined;
  // Built at click time, so the export writes the rows and columns on
  // screen then.
  const handler: ExportRunHandler = (controls) =>
    makeExportCsvHandler(
      options.exportCsv,
      options.source(),
      options.columns(),
      undefined,
      options.featureHost
    )?.(controls);
  const controller = createExportController({
    handler: resolved ? handler : undefined,
    pageOnly: false,
    serverBuilt,
  });
  injector.get(DestroyRef).onDestroy(controller.connect());
  const snapshot = fromStore(controller, { injector });
  return computed(() => {
    const { status, progress, message, error, downloadUrl, run } = snapshot();
    const labels = options.labels();
    return {
      onExportCsv: resolved ? controller.start : undefined,
      exportBusy: status === "busy",
      exportStatus: status,
      exportAnnouncement: resolveExportAnnouncement({
        status,
        run,
        labels,
        progress,
        serverBuilt,
      }),
      exportProgressState: resolveExportProgressState({
        serverBuilt,
        status,
        progress,
        message,
        error,
        downloadUrl,
        cancel: controller.cancel,
        retry: controller.start,
        dismiss: controller.dismiss,
      }),
      exportLabel: exportButtonLabel(labels, format),
      exportDisabled: false,
      exportDisabledReason: resolveExportDisabledReason(labels, false),
    };
  });
}

/**
 * CSV export of the current view. {@link injectExportHandler} is the run.
 *
 * @param options - See {@link ExportCsvHandlerOptions}.
 * @returns The state a toolbar's Export button reads.
 *
 * @public
 */
export function injectExportCsv<TRow>(
  options: ExportCsvHandlerOptions<TRow>
): Signal<ExportHandlerState> {
  return injectExportHandler(options);
}

/** Options that name `writer`, or the writer alone when the host passed `true`. */
function writerOptions<TRow>(
  options: true | Omit<ExportCsvOptions<TRow>, "writer">,
  writer: ExportWriter
): ExportCsvOptions<TRow> {
  if (options === true) return { writer };
  return { ...options, writer };
}

/** A feature that writes with `writer`, or no export when `options` is false. */
function exportWith<TRow>(
  options: boolean | Omit<ExportCsvOptions<TRow>, "writer">,
  writer: ExportWriter
): AdaptTableFeature {
  if (options === false) return coreExportCsv(false);
  return coreExportCsv(writerOptions(options, writer));
}

/**
 * XLSX export of the current view, through `@adapttable/core/xlsx`.
 *
 * @param options - `true`, `false`, or the export's scope, columns and filename.
 * @returns The feature.
 *
 * @public
 */
export function exportXlsx<TRow>(
  options: boolean | Omit<ExportCsvOptions<TRow>, "writer"> = true
): AdaptTableFeature {
  return exportWith(options, xlsxWriter());
}

/**
 * PDF export of the current view, through `@adapttable/core/pdf`.
 *
 * @param options - `true`, `false`, or the export's scope, columns and filename.
 * @returns The feature.
 *
 * @public
 */
export function exportPdf<TRow>(
  options: boolean | Omit<ExportCsvOptions<TRow>, "writer"> = true
): AdaptTableFeature {
  return exportWith(options, pdfWriter());
}
