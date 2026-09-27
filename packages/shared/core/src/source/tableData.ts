/**
 * The table data controller: which tier serves a table's rows, and the
 * declarative filters every tier shares.
 *
 * A binding holds one {@link TableData} per table. Each update it hands over
 * the table's data props and gets a {@link TableDataPlan} back — the tier, the
 * merged filter runtime, the predicate the frontend tier filters with and the
 * facet keys the server tier asks for — builds the tier's source from it, then
 * hands that source back to have facet counts computed where no server
 * answered them. The controller also loads each filter's own option list once,
 * and, when a frontend table has an `onQueryChange`, tells it about each
 * change. A binding adds only its own reactivity and the moment it commits.
 */
import type { ColumnMetadata } from "../columnModel";
import type { FeatureHostState } from "../features/currentHost";
import type { FacetMap } from "../filters/facets";
import type { FilterDef, FilterRuntime } from "../filters/filterDefs";
import type { FilterEngine } from "../filters/filterEngine";
import type {
  FilterTypeRegistry,
  FilterTypeSpec,
} from "../filters/filterRegistry";
import type { ExtraFilters } from "../types";
import { stableKey } from "../utils/stableKey";
import {
  createFilterOptionsLoader,
  createQueryEmitter,
  type DataTier,
  type LoadedFilterOption,
  type QueryEmitter,
  resolveDataTier,
  type TableQueryListener,
  warnDataTierMisuse,
} from "./dataTier";
import type { QueryFilterGroup } from "./queryContract";
import type { TableQuery } from "./tableQuery";
import type { TableSource } from "./TableSource";

const EMPTY_REGISTRY: FilterTypeRegistry = {
  get: () => undefined,
  has: () => false,
  types: () => [],
};

const EMPTY_RUNTIME: FilterRuntime<never> = {
  defs: [],
  arrayExtraKeys: [],
  numberExtraKeys: [],
  filterLabels: {},
  filterFn: () => true,
  registry: EMPTY_REGISTRY,
};

/**
 * A table's data props, as of one update.
 *
 * @public
 */
export interface TableDataConfig<TRow> {
  /**
   * The filter engine, when the filters feature is composed. Without it no
   * filter is built, counted or loaded.
   */
  readonly engine: FilterEngine | undefined;
  /** Full-control tier: a prebuilt source. */
  readonly source?: TableSource<TRow>;
  /** The rows: all of them (frontend) or the current page (server). */
  readonly data?: readonly TRow[];
  /** Explicit data mode; absent, the tier is inferred. */
  readonly mode?: "frontend" | "server";
  /** The server tier's fetch, or a frontend table's change notification. */
  readonly onQueryChange?: TableQueryListener;
  /** Columns — their `filter` shorthands feed the runtime. */
  readonly columns: readonly ColumnMetadata<TRow>[];
  /** Table-level declarative filters. */
  readonly declaredFilters?: readonly FilterDef<TRow>[];
  /** Extra or replacement filter types merged onto the built-in registry. */
  readonly filterTypes?: readonly FilterTypeSpec[];
  /** The host of this table — filter-type plugins resolve from here. */
  readonly featureHost?: FeatureHostState;
  /** Active locale for `i18n` column paths. */
  readonly locale?: string;
  /** Extra client-side predicate AND-ed with the declarative ones. */
  readonly filterFn?: (row: TRow, extra: ExtraFilters) => boolean;
  /** Keys the server tier counts; defaults to every checklist filter. */
  readonly facetKeys?: readonly string[];
}

/**
 * What the table runs on, as of one update.
 *
 * @public
 */
export interface TableDataPlan<TRow> {
  /** Which tier serves the rows. */
  readonly tier: DataTier;
  /** The merged declarative-filter runtime. */
  readonly runtime: FilterRuntime<TRow>;
  /** The declarative filters AND-ed with the host's `filterFn`. */
  readonly filterFn: (row: TRow, extra: ExtraFilters) => boolean;
  /** Evaluates the AND/OR filter tree, when the engine is composed. */
  readonly filterTreeFn:
    ((row: TRow, tree: QueryFilterGroup) => boolean) | undefined;
  /** The facet keys a server query asks for. */
  readonly facetKeys: readonly string[] | undefined;
}

/**
 * One table's data controller.
 *
 * @public
 */
export interface TableData<TRow> {
  /** Plan this update. The same inputs give the same pieces. */
  readonly plan: (config: TableDataConfig<TRow>) => TableDataPlan<TRow>;
  /**
   * The source the table reads: `resolved` with facet counts computed from
   * its searched rows when nothing answered them. `frontend` is the frontend
   * tier's source, which a frontend table's `onQueryChange` is told about.
   */
  readonly finish: (sources: {
    readonly resolved: TableSource<TRow>;
    readonly frontend: TableSource<TRow>;
  }) => TableSource<TRow>;
  /**
   * Once the frame is on screen: tell a frontend table's `onQueryChange`
   * about a change. The mount is not a change.
   */
  readonly commit: () => void;
  /** Abort the notification in flight, for when the table goes away. */
  readonly dispose: () => void;
  /**
   * Start every option list the current filters load on their own, once each.
   * Returns the release: a load that settles after it reports nothing.
   */
  readonly loadOptions: () => () => void;
  /** Be told when a loaded option list moved the plan. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Moves each time subscribers are told, for a snapshot-based binding. */
  readonly revision: () => number;
}

/** Recompute only when an input changed identity, like a memo hook. */
function memoOne<TArgs extends readonly unknown[], TResult>(
  compute: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  let last: { args: TArgs; result: TResult } | undefined;
  return (...args) => {
    if (last?.args.every((arg, index) => Object.is(arg, args[index]))) {
      return last.result;
    }
    const result = compute(...args);
    last = { args, result };
    return result;
  };
}

/** The change notice a frontend table's `onQueryChange` receives. */
function noticeOf<TRow>(source: TableSource<TRow>): TableQuery {
  return {
    page: source.page,
    limit: source.limit,
    search: source.search,
    sortBy: source.sortBy,
    sortDir: source.sortDir,
    sortLevels: source.sortLevels ?? [],
    filters: source.extra,
  };
}

/**
 * Create one table's data controller.
 *
 * @public
 */
export function createTableData<TRow>(): TableData<TRow> {
  const listeners = new Set<() => void>();
  let revision = 0;
  const notify = (): void => {
    revision += 1;
    for (const listener of listeners) listener();
  };

  const loader = createFilterOptionsLoader();
  const optionCache = new Map<
    string,
    () => Promise<readonly { value: string; label: string }[]>
  >();
  let loadedOptions: Record<string, readonly LoadedFilterOption[]> = {};
  let latest:
    { config: TableDataConfig<TRow>; plan: TableDataPlan<TRow> } | undefined;
  let abortNotice: (() => void) | undefined;
  let notice:
    | {
        emitter: QueryEmitter;
        query: TableQuery;
        key: string;
      }
    | undefined;

  const runtimeOf = memoOne(
    (
      engine: FilterEngine | undefined,
      columns: readonly ColumnMetadata<TRow>[],
      declaredFilters: readonly FilterDef<TRow>[] | undefined,
      locale: string | undefined,
      data: readonly TRow[] | undefined,
      loaded: Record<string, readonly LoadedFilterOption[]>,
      filterTypes: readonly FilterTypeSpec[] | undefined,
      featureHost: FeatureHostState | undefined
    ): FilterRuntime<TRow> =>
      engine
        ? engine.buildRuntime({
            columns,
            declaredFilters,
            locale,
            data: data ?? [],
            loadedOptions: loaded,
            filterTypes,
            featureHost,
            optionCache,
          })
        : (EMPTY_RUNTIME as FilterRuntime<TRow>)
  );
  const combinedFilterOf = memoOne(
    (
      runtime: FilterRuntime<TRow>,
      filterFn: ((row: TRow, extra: ExtraFilters) => boolean) | undefined
    ) =>
      filterFn
        ? (row: TRow, extra: ExtraFilters) =>
            runtime.filterFn(row, extra) && filterFn(row, extra)
        : runtime.filterFn
  );
  const treeFilterOf = memoOne(
    (engine: FilterEngine | undefined, runtime: FilterRuntime<TRow>) =>
      engine
        ? (row: TRow, tree: QueryFilterGroup) =>
            engine.evaluateTree(tree, row, runtime.defs, runtime.registry)
        : undefined
  );
  const facetKeysOf = memoOne(
    (
      engine: FilterEngine | undefined,
      facetKeys: readonly string[] | undefined,
      defs: readonly FilterDef<TRow>[],
      registry: FilterTypeRegistry
    ) => {
      if (facetKeys) return facetKeys;
      if (!engine) return undefined;
      return defs
        .filter(
          (def) => (registry.get(def.type)?.widget ?? def.type) === "checklist"
        )
        .map((def) => def.key);
    }
  );
  // Facet counts for the checklist filters, when nothing else answered them:
  // a frontend tier has the rows in hand, so the counts come from the same
  // predicate the table filters with — every filter EXCEPT the one being
  // counted, which is what makes a checklist show what each choice yields.
  const facetsOf = memoOne(
    (
      engine: FilterEngine | undefined,
      resolved: TableSource<TRow>,
      defs: readonly FilterDef<TRow>[],
      registry: FilterTypeRegistry,
      filterFn: (row: TRow, extra: ExtraFilters) => boolean
    ): FacetMap | undefined => {
      if (!engine || resolved.facets) return resolved.facets;
      const rows = resolved.allSearchedRows;
      if (!rows) return undefined;
      const tree = resolved.filterTree;
      const keep = (row: TRow, extra: ExtraFilters) => {
        if (!filterFn(row, extra)) return false;
        if (!tree) return true;
        return engine.evaluateTree(tree, row, defs, registry);
      };
      return engine.computeFacets(defs, rows, resolved.extra, keep, registry);
    }
  );
  const withFacets = memoOne(
    (resolved: TableSource<TRow>, facets: FacetMap | undefined) =>
      facets ? { ...resolved, facets } : resolved
  );

  function plan(config: TableDataConfig<TRow>): TableDataPlan<TRow> {
    const { engine, source, mode, data, onQueryChange } = config;
    const runtime = runtimeOf(
      engine,
      config.columns,
      config.declaredFilters,
      config.locale,
      data,
      loadedOptions,
      config.filterTypes,
      config.featureHost
    );
    const tier = resolveDataTier(source, mode, onQueryChange);
    warnDataTierMisuse(source, mode, data, onQueryChange);
    const next: TableDataPlan<TRow> = {
      tier,
      runtime,
      filterFn: combinedFilterOf(runtime, config.filterFn),
      filterTreeFn: treeFilterOf(engine, runtime),
      facetKeys: facetKeysOf(
        engine,
        config.facetKeys,
        runtime.defs,
        runtime.registry
      ),
    };
    latest = { config, plan: next };
    return next;
  }

  function current() {
    if (!latest) {
      throw new Error("createTableData: call plan() first");
    }
    return latest;
  }

  return {
    plan,
    finish({ resolved, frontend }) {
      const { config, plan: planned } = current();
      // The key the table mounted with is already seen: a notification is a
      // CHANGE, and the mount is not one.
      const query = noticeOf(frontend);
      const key = stableKey(query);
      notice = notice
        ? { emitter: notice.emitter, query, key }
        : { emitter: createQueryEmitter(key), query, key };
      const facets = facetsOf(
        config.engine,
        resolved,
        planned.runtime.defs,
        planned.runtime.registry,
        planned.filterFn
      );
      return withFacets(resolved, facets);
    },
    commit() {
      if (!notice) return;
      const { config, plan: planned } = current();
      const notifying =
        planned.tier === "frontend" && config.mode === "frontend";
      const abort = notice.emitter.emitIfChanged(
        notifying ? config.onQueryChange : undefined,
        notice.query,
        notice.key
      );
      if (abort) {
        abortNotice?.();
        abortNotice = abort;
      }
    },
    dispose() {
      abortNotice?.();
      abortNotice = undefined;
    },
    loadOptions() {
      const { config, plan: planned } = current();
      if (!config.engine) return () => undefined;
      return loader.load(planned.runtime.defs, (key, options) => {
        loadedOptions = { ...loadedOptions, [key]: options };
        notify();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    revision: () => revision,
  };
}
