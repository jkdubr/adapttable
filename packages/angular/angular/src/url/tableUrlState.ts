/**
 * URL-synced view state: page, page size, search, sort, grouping and filters
 * in the query string, read through `@adapttable/core`'s view-state store.
 */
import {
  createMemoryAdapter,
  createTableViewStore,
  type ExtraFilters,
  resolveUrlAdapter,
  type TableQueryParams,
  type TableViewState,
  type TableViewStateConfig,
  type TableViewStore,
  type UrlStateAdapter,
} from "@adapttable/core";
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  inject,
  InjectionToken,
  Injector,
  type Signal,
  untracked,
} from "@angular/core";

import { fromStore, type MaybeSignalOptional, readMaybe } from "../store";

/**
 * The URL adapter every table in this injector reads and writes, when the
 * table names none. Provide an adapter over the Angular Router here to keep
 * table state in the router's URL; without one, tables use the browser's
 * History API.
 *
 * @public
 */
export const ADAPTTABLE_URL_ADAPTER = new InjectionToken<UrlStateAdapter>(
  "ADAPTTABLE_URL_ADAPTER"
);

/**
 * Options for {@link injectTableUrlState}.
 *
 * @public
 */
export interface TableUrlStateOptions {
  /**
   * URL-state backend. Defaults to {@link ADAPTTABLE_URL_ADAPTER}, then the
   * browser History API.
   */
  readonly urlAdapter?: UrlStateAdapter;
  /**
   * When `false`, state lives in a memory store owned by this table instead
   * of the URL. Defaults to `true`.
   */
  readonly urlSync?: boolean;
  /**
   * Initial values applied when the URL has no value for a key. A signal
   * reconfigures the store when it moves.
   */
  readonly defaults?: MaybeSignalOptional<
    Partial<TableQueryParams> & { extra?: ExtraFilters }
  >;
  /** Extra-filter keys whose values are parsed as numbers. */
  readonly numberExtraKeys?: MaybeSignalOptional<readonly string[]>;
  /** Extra-filter keys whose values are comma-separated arrays. */
  readonly arrayExtraKeys?: MaybeSignalOptional<readonly string[]>;
  /**
   * Namespace for this table's URL params, so several tables share one URL:
   * with `urlKey: "left"` the params become `left.q`, `left.page`, …
   */
  readonly urlKey?: string;
  /** The injector to run in. Omit to use the current injection context. */
  readonly injector?: Injector;
}

/**
 * The view state as a signal, and every change a reader can make to it.
 *
 * @public
 */
export interface TableUrlState extends Pick<
  TableViewStore,
  | "setPage"
  | "setLimit"
  | "setSort"
  | "setGroupBy"
  | "initializeGroupBy"
  | "setGroupAggregateOverrides"
  | "toggleSortLevel"
  | "setSearch"
  | "setExtra"
  | "setExtras"
  | "setFilterTree"
  | "clearExtras"
  | "clearAll"
> {
  /** The current view state. */
  readonly state: Signal<TableViewState>;
}

/**
 * URL-synced table state for an Angular component or service.
 *
 * `defaults` apply only while the URL is silent about a key; clearing a
 * defaulted value records an empty param so the default does not come back.
 * The store and its subscription live as long as the injection context.
 *
 * @param options - See {@link TableUrlStateOptions}.
 * @returns The state signal and its mutators.
 *
 * @public
 */
export function injectTableUrlState(
  options: TableUrlStateOptions = {}
): TableUrlState {
  if (!options.injector) assertInInjectionContext(injectTableUrlState);
  const injector = options.injector ?? inject(Injector);
  const adapter = urlAdapterFor(options, injector);
  const config = computed((): TableViewStateConfig => ({
    defaults: readMaybe(options.defaults),
    numberExtraKeys: readMaybe(options.numberExtraKeys),
    arrayExtraKeys: readMaybe(options.arrayExtraKeys),
  }));
  const store = createTableViewStore(
    {
      adapter,
      urlKey: options.urlKey,
    },
    untracked(config)
  );
  // Later configuration reaches the store through `configure`, which keeps
  // every unchanged value's identity; the store reads it when its state is
  // read, so the state is derived rather than notified.
  const configured = computed(() => {
    const next = config();
    store.configure(next);
    return next;
  });
  const snapshot = fromStore(store, { injector });
  // Two tables on one adapter without distinct urlKeys clobber each other's
  // params — the store warns in development.
  injector.get(DestroyRef).onDestroy(store.claimNamespace());

  return {
    state: computed(() => {
      configured();
      snapshot();
      return store.getSnapshot();
    }),
    setPage: store.setPage,
    setLimit: store.setLimit,
    setSort: store.setSort,
    setGroupBy: store.setGroupBy,
    initializeGroupBy: store.initializeGroupBy,
    setGroupAggregateOverrides: store.setGroupAggregateOverrides,
    toggleSortLevel: store.toggleSortLevel,
    setSearch: store.setSearch,
    setExtra: store.setExtra,
    setExtras: store.setExtras,
    setFilterTree: store.setFilterTree,
    clearExtras: store.clearExtras,
    clearAll: store.clearAll,
  };
}

/**
 * The URL backend a table's state goes through: its own adapter, else the
 * injector's, else the History API — or a private memory store when the
 * table does not sync with the URL.
 *
 * @param options - The table's URL options.
 * @param injector - Where {@link ADAPTTABLE_URL_ADAPTER} is looked up.
 * @returns The adapter.
 *
 * @public
 */
export function urlAdapterFor(
  options: Pick<TableUrlStateOptions, "urlAdapter" | "urlSync">,
  injector: Injector
): UrlStateAdapter {
  const provided =
    options.urlAdapter ??
    injector.get(ADAPTTABLE_URL_ADAPTER, null, { optional: true }) ??
    undefined;
  return resolveUrlAdapter(
    provided,
    options.urlSync ?? true,
    createMemoryAdapter()
  );
}
