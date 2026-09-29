/**
 * The toolbar's optional controls, as signals: row density kept in the URL,
 * the fullscreen toggle, and CSV export — each over core's model.
 */
import {
  type ColumnMetadata,
  createExportController,
  createUrlSliceStore,
  densitySlice,
  exportButtonLabel,
  type ExportCsvOptions,
  type ExportRunHandler,
  makeExportCsvHandler,
  resolveExportAnnouncement,
  resolveExportCsv,
  resolveExportDisabledReason,
  resolveExportProgressState,
  type TableDensity,
  type TableLabels,
  type TableSource,
} from "@adapttable/core";
import {
  type ExportHandlerState,
  type FeatureHostState,
  type FullscreenState,
} from "@adapttable/core/binding";
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  type Signal,
  signal,
} from "@angular/core";

import { fromStore } from "../store";
import { type TableUrlStateOptions, urlAdapterFor } from "../url/tableUrlState";

/**
 * Options for {@link injectDensity}.
 *
 * @public
 */
export interface DensityOptions extends Pick<
  TableUrlStateOptions,
  "urlAdapter" | "urlSync" | "urlKey"
> {
  /** The density while the URL says nothing. Defaults to comfortable. */
  readonly defaultDensity?: TableDensity;
  /** The injector to run in. Omit inside an injection context. */
  readonly injector?: Injector;
}

/**
 * Row density, kept in the URL beside the table's other view state.
 *
 * @public
 */
export interface DensityState {
  /** The current density. */
  readonly density: Signal<TableDensity>;
  /** Change it. */
  readonly setDensity: (next: TableDensity) => void;
}

/**
 * Row density in the URL.
 *
 * @param options - See {@link DensityOptions}.
 * @returns See {@link DensityState}.
 *
 * @public
 */
export function injectDensity(options: DensityOptions = {}): DensityState {
  if (!options.injector) assertInInjectionContext(injectDensity);
  const injector = options.injector ?? inject(Injector);
  const store = createUrlSliceStore(
    { adapter: urlAdapterFor(options, injector), urlKey: options.urlKey },
    densitySlice,
    { defaultDensity: options.defaultDensity }
  );
  // A change still waiting on its debounce is written before the table goes.
  injector.get(DestroyRef).onDestroy(() => {
    store.flush();
  });
  return {
    density: fromStore(store, { injector }),
    setDensity: store.set,
  };
}

/**
 * Fullscreen for one element: whether it is fullscreen, whether the browser
 * allows it, and the toggle. The document is the source of truth, so Escape
 * and the browser's own control are followed too.
 *
 * @param element - The element to take fullscreen.
 * @param injector - The injector to run in. Omit inside an injection context.
 * @returns The state, as a signal.
 *
 * @public
 */
export function injectFullscreen(
  element: Signal<HTMLElement | undefined>,
  injector?: Injector
): Signal<FullscreenState> {
  if (!injector) assertInInjectionContext(injectFullscreen);
  const context = injector ?? inject(Injector);
  const supported =
    typeof document !== "undefined" && document.fullscreenEnabled;
  const active = signal(false);
  effect(
    (onCleanup) => {
      const target = element();
      if (!supported) return;
      const sync = (): void => {
        active.set(
          target !== undefined && document.fullscreenElement === target
        );
      };
      sync();
      document.addEventListener("fullscreenchange", sync);
      onCleanup(() => {
        document.removeEventListener("fullscreenchange", sync);
      });
    },
    { injector: context }
  );
  const exit = (): void => {
    if (document.fullscreenElement) void document.exitFullscreen();
  };
  const toggle = (): void => {
    const target = element();
    if (!supported || !target) return;
    if (document.fullscreenElement === target) {
      void document.exitFullscreen();
      return;
    }
    // A browser refuses fullscreen a real gesture did not ask for; that is
    // not an error worth throwing at the host.
    target.requestFullscreen().catch(() => undefined);
  };
  return computed(() => {
    const target = element();
    return {
      active: active(),
      supported,
      toggle,
      exit,
      container: active() && target ? target : undefined,
    };
  });
}

/**
 * Options for {@link injectExportCsv}.
 *
 * @public
 */
export interface ExportCsvHandlerOptions<TRow> {
  /** The export configuration, from `exportCsv(...)`. */
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
 * CSV export of the table's view: the button's handler, whether it is busy,
 * what it announces and its label.
 *
 * @param options - See {@link ExportCsvHandlerOptions}.
 * @returns The state a toolbar's Export button reads.
 *
 * @public
 */
export function injectExportCsv<TRow>(
  options: ExportCsvHandlerOptions<TRow>
): Signal<ExportHandlerState> {
  if (!options.injector) assertInInjectionContext(injectExportCsv);
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
