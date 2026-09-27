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
  type TableViewStore,
  type UrlStateAdapter,
} from "@adapttable/core";
import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  InjectionToken,
  Injector,
  type Signal,
} from "@angular/core";

import { fromStore } from "./store";

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
  /** Initial values applied when the URL has no value for a key. */
  readonly defaults?: Partial<TableQueryParams> & { extra?: ExtraFilters };
  /** Extra-filter keys whose values are parsed as numbers. */
  readonly numberExtraKeys?: readonly string[];
  /** Extra-filter keys whose values are comma-separated arrays. */
  readonly arrayExtraKeys?: readonly string[];
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
  const provided =
    options.urlAdapter ??
    injector.get(ADAPTTABLE_URL_ADAPTER, null, { optional: true }) ??
    undefined;
  const adapter = resolveUrlAdapter(
    provided,
    options.urlSync ?? true,
    createMemoryAdapter()
  );
  const store = createTableViewStore(
    { adapter, urlKey: options.urlKey },
    {
      defaults: options.defaults,
      numberExtraKeys: options.numberExtraKeys,
      arrayExtraKeys: options.arrayExtraKeys,
    }
  );
  // Two tables on one adapter without distinct urlKeys clobber each other's
  // params — the store warns in development.
  injector.get(DestroyRef).onDestroy(store.claimNamespace());

  return {
    state: fromStore(store, { injector }),
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
