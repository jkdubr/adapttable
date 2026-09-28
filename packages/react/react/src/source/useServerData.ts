import {
  type ColumnMetadata,
  createServerSource,
  type FacetMap,
  type PaginationMode,
  type QueryAggregate,
  type QuerySupport,
  resolvePaginationMode,
  type ServerSource,
  type TableQuery,
  type TableSource,
} from "@adapttable/core";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useIsMobile } from "../hooks/useIsMobile";
import {
  useTableUrlState,
  type UseTableUrlStateOptions,
} from "../url/useTableUrlState";

/**
 * One consolidated snapshot of everything a server query needs.
 *
 * The fields below the baseline come from {@link QueryExtensions} and are all
 * optional: a source receives one only after declaring it can answer it
 * (`supports`), so an endpoint written before a capability existed keeps
 * receiving exactly the query it was written against.
 *
 * @public
 */
export type { TableQuery };

/**
 * Options for `useServerData`.
 *
 * @public
 */
export interface UseServerDataOptions<TRow> extends Pick<
  UseTableUrlStateOptions,
  | "urlAdapter"
  | "urlSync"
  | "defaults"
  | "numberExtraKeys"
  | "arrayExtraKeys"
  | "urlKey"
> {
  /** The current page of rows, exactly as the server returned them. */
  rows: readonly TRow[];
  /** Total row count across all pages (drives the pager). */
  total: number;
  /**
   * Cursor pagination: the token the last response returned for the page
   * after the one on screen, or `null` when that was the last page.
   *
   * Only read when the source declares `supports.cursor`. With it, position
   * comes from the token rather than an offset, so rows that shift while the
   * user reads never duplicate or skip an entry — the failure mode
   * offset-based paging cannot avoid.
   *
   * A cursor is opaque, so the table only ever hands back one the server
   * gave it. That makes "next" always possible, "back" possible for pages
   * already visited, and a jump to an arbitrary unvisited page impossible —
   * the honest shape of cursor pagination, not a limitation to work around.
   */
  nextCursor?: string | null;
  /** Whether a request is currently in flight. */
  loading?: boolean;
  /** Forwarded error to display. */
  error?: Error | null;
  /** Pagination mode. Defaults to `"auto"` (mobile → infinite). */
  paginationMode?: PaginationMode;
  /** Force the resolved mobile state instead of a media query (test/SSR seam). */
  forceMobile?: boolean;
  /**
   * The width, in pixels, at or below which `paginationMode="auto"` resolves
   * to infinite scroll. Defaults to 768. Pass the table's `mobileBreakpoint`
   * so the mode follows the same rule as the card layout.
   */
  mobileBreakpoint?: number;
  /**
   * What this endpoint can answer beyond the baseline query. Declare a
   * capability and the matching field starts arriving in `onQueryChange`;
   * leave it out and the field is never sent, with a development warning if
   * the UI wanted it. See {@link QuerySupport}.
   */
  supports?: QuerySupport;
  /** Aggregate requests to send when the endpoint supports them. */
  aggregates?: readonly QueryAggregate[];
  /**
   * Columns used to refuse a stale or disallowed aggregate request before
   * it is sent. The same `aggregatable` rules the panel and column menu
   * resolve; omit them and only the backend's listed operations are gated.
   */
  columns?: readonly ColumnMetadata<TRow>[];
  /**
   * The `key` from the `onQueryChange` call these `rows` answer.
   *
   * A controlled tier cannot see which request a response belongs to: the
   * rows simply change, sometimes as the very array that was already there,
   * sometimes not at all when a fetch fails or is aborted. Echo the key back
   * and the table knows exactly what the rows on screen were computed with —
   * which is what a column's `formatAggregate` is told.
   *
   * This is the ONLY way a controlled tier can be accurate about it. Without
   * it, rows retained through an in-flight or failed request keep the
   * operations they came with, but a request that merely stops — the
   * signature of an abort as much as of an answer — leaves the rows described
   * as unknown, and `formatAggregate` is passed no operation at all.
   */
  responseKey?: string;
  /**
   * The tree nodes the reader has open, when the hierarchy lives on the server.
   * Sent as `query.expandedIds` only if the source declares
   * `supports: { tree: true }`, so the response can carry the children of every
   * open branch alongside the page. Hold the same array in the table's
   * `expandedIds` and one piece of state drives both.
   */
  expandedIds?: readonly string[];
  /**
   * Filter keys to ask the server for distinct-value counts. Sent as
   * `query.facets` only when `supports.facets` is set.
   */
  facetKeys?: readonly string[];
  /**
   * Distinct-value counts from the last fetch. Surfaces on the source
   * so a checklist can render without holding the full result set.
   */
  facets?: FacetMap;
  /**
   * Fired with the consolidated {@link TableQuery} whenever it changes —
   * including once on mount with the URL-restored values. The previous
   * call's `signal` is aborted when a newer query supersedes it; forward it
   * to `fetch` and out-of-order responses die at the source.
   */
  onQueryChange?: (
    query: TableQuery,
    info: { signal: AbortSignal; key: string }
  ) => void | Promise<void>;
}

/**
 * The hand-rolled-fetch server tier: the table owns the query state (URL,
 * widgets, chips, debounce) and emits ONE consolidated event per real
 * change; the caller's only job is to run the request and hand back
 * `rows` + `total`. No query library required — and the full
 * `useQuerySource` tier remains for callers who want one.
 *
 * Implements the shared source contract: `isLoading` covers the first
 * load only, `isFetching` any in-flight request, and in infinite mode
 * `fetchNextPage` APPENDS the next page's rows to those on screen
 * (accumulating across `onQueryChange` round-trips) instead of replacing
 * them.
 *
 * @typeParam TRow - The row type.
 *
 * @public
 */
export function useServerData<TRow>(
  options: UseServerDataOptions<TRow>
): TableSource<TRow> {
  // The source is mutable and must see every render's inputs, and every
  // table's base bundle carries this hook: the compiler's cache would skip
  // updates and add weight without adding hits.
  "use no memo";
  const {
    rows,
    total,
    nextCursor = null,
    loading = false,
    error = null,
    paginationMode = "auto",
    forceMobile,
    mobileBreakpoint,
    supports,
    aggregates,
    columns,
    responseKey,
    expandedIds,
    facetKeys,
    facets,
    onQueryChange,
    ...urlOptions
  } = options;
  const mediaMobile = useIsMobile(mobileBreakpoint);
  const isMobile = forceMobile ?? mediaMobile;
  const resolvedMode = resolvePaginationMode(paginationMode, isMobile);

  const state = useTableUrlState(urlOptions);
  const [source] = useState<ServerSource<TRow>>(createServerSource);
  // The source's own state — an append, the cursor trail, a refetch, the
  // aggregate operations — re-renders through its subscription.
  useSyncExternalStore(source.subscribe, source.revision, source.revision);

  const frame = source.update(
    {
      rows,
      total,
      nextCursor,
      loading,
      error,
      paginationMode: resolvedMode,
      supports,
      aggregates,
      columns,
      responseKey,
      expandedIds,
      facetKeys,
      onQueryChange,
    },
    state
  );
  // Once React accepts the render: send a changed query, latch the first
  // load, clamp, record the cursor, and settle the aggregate operations.
  useEffect(() => {
    source.commit();
  });
  // The request in flight is aborted when the table unmounts; a remount
  // sends it again.
  useEffect(() => source.dispose, [source]);

  return {
    rows: frame.rows,
    total,
    page: state.page,
    limit: state.limit,
    defaultLimit: state.defaultLimit,
    search: state.search,
    sortBy: state.sortBy,
    sortDir: state.sortDir,
    groupBy: state.groupBy,
    groupAggregateOverrides: state.groupAggregateOverrides,
    groupAggregations: frame.groupAggregations,
    queryAggregates: aggregates,
    aggregateOperations: supports?.aggregateOperations,
    honorsAggregates:
      Boolean(supports?.aggregates) || Boolean(supports?.aggregateOperations),
    extra: state.extra,
    facets,
    filterTree: state.filterTree,
    isLoading: frame.isLoading,
    isFetching: loading,
    isFetchingNextPage: frame.isFetchingNextPage,
    hasNextPage: frame.hasNextPage,
    error,
    paginationMode: resolvedMode,
    setPage: source.setPage,
    setLimit: state.setLimit,
    setSort: state.setSort,
    setGroupBy: state.setGroupBy,
    initializeGroupBy: state.initializeGroupBy,
    setGroupAggregateOverrides: state.setGroupAggregateOverrides,
    sortLevels: state.sortLevels,
    toggleSortLevel: state.toggleSortLevel,
    setSearch: state.setSearch,
    setExtra: state.setExtra,
    setExtras: state.setExtras,
    setFilterTree: state.setFilterTree,
    clearExtras: state.clearExtras,
    clearAll: state.clearAll,
    fetchNextPage: source.fetchNextPage,
    refetch: source.refetch,
  };
}
