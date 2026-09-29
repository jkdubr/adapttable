/**
 * The interactive grouping panel for Angular: a core controller over the
 * live table, published as a {@link GroupingPanelState} signal the Chrome
 * and the {@link GROUPING_PANEL} slot draw from.
 */
import {
  createGroupingPanelController,
  declaredAggregates,
  parseGroupBy,
  type TableRuntime,
  type TableRuntimeView,
  type TableSource,
} from "@adapttable/core";
import {
  coreGroupingPanel,
  type GroupingPanelSlotProps,
  groupingPanelState,
} from "@adapttable/core/binding";
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  type Signal,
  signal,
} from "@angular/core";

import type { ColumnDef } from "./columnDef";
import type { DataTable } from "./dataTable";
import type { AdaptTableFeature } from "./features";
import { fromStore } from "./store";

/**
 * Extras the grouping panel accepts, matching React's shape so a kit can
 * declare aggregates the same way.
 *
 * @public
 */
export interface GroupingPanelExtras<TRow = unknown> {
  /** Per-group subtotals, the same mapper shape as a summary row. */
  readonly groupAggregates?: (rows: readonly TRow[]) => unknown;
}

/**
 * A grouping-panel feature that also carries the seed keys and extras the
 * controller reads once.
 */
interface GroupingPanelFeature<TRow = unknown> extends AdaptTableFeature {
  readonly initialGroupBy?: string | readonly string[];
  readonly extras?: GroupingPanelExtras<TRow>;
}

/**
 * Interactive row grouping: the panel owns the group-by state, and a kit
 * fills {@link GROUPING_PANEL} with its own strip.
 *
 * The binding ships only the feature's configuration. The unstyled kit (or
 * any other kit) extends this with `slotRender(GROUPING_PANEL, …)`.
 *
 * @param groupBy - Initial grouping keys; the URL keeps whatever it already has.
 * @param extras - Row-aware aggregate options.
 * @returns The feature.
 *
 * @public
 */
export function groupingPanel<TRow = unknown>(
  groupBy?: string | readonly string[],
  extras: GroupingPanelExtras<TRow> = {}
): AdaptTableFeature {
  return {
    ...coreGroupingPanel<TRow>(groupBy, extras),
    initialGroupBy: groupBy,
    extras,
  } as GroupingPanelFeature<TRow>;
}

/**
 * Options for {@link injectGroupingPanelState}.
 *
 * @public
 */
export interface GroupingPanelStateOptions<TRow> {
  /** The headless table. */
  readonly table: DataTable<TRow>;
  /** The live source the controller reads grouping from. */
  readonly source: Signal<TableSource<TRow>>;
  /** The composed features; the panel seeds from the one with id `grouping-panel`. */
  readonly features: readonly AdaptTableFeature[];
  /** The injector to run effects in. */
  readonly injector?: Injector;
}

/**
 * Whether any composed feature is the grouping panel.
 */
function groupingPanelFeatureOf(
  features: readonly AdaptTableFeature[]
): GroupingPanelFeature | undefined {
  return features.find(
    (feature): feature is GroupingPanelFeature =>
      feature.id === "grouping-panel"
  );
}

/**
 * Build the live {@link TableRuntime} a grouping panel controller reads.
 *
 * @internal
 */
export function tableRuntimeFor<TRow>(
  table: DataTable<TRow>,
  source: Signal<TableSource<TRow>>,
  features: readonly AdaptTableFeature[]
): TableRuntime<TRow> {
  const featureIds = features.map(
    (feature, index) => feature.id ?? `feature-${String(index)}`
  );
  return {
    rowAt: (index) => source().rows[index],
    labels: () => table.labels(),
    featureIds: () => featureIds,
    view: (): TableRuntimeView<TRow> | undefined => {
      const current = source();
      const columns = table.allColumns();
      return {
        rows: current.rows,
        getRowId: (row) => table.rowKey(row),
        rowLabel: (row) => table.rowKey(row),
        groupingState: {
          groupBy: current.groupBy,
          aggregateOverrides: current.groupAggregateOverrides ?? {},
          columnLabel: (key) => {
            const column = columns.find((entry) => entry.key === key);
            return typeof column?.header === "string" ? column.header : key;
          },
          columns,
          setGroupBy: current.setGroupBy,
          initializeGroupBy: current.initializeGroupBy,
          setAggregateOverrides: current.setGroupAggregateOverrides,
        },
        query: {
          page: current.page,
          limit: current.limit,
          total: current.total,
          defaultLimit: current.defaultLimit,
          search: current.search,
          sortBy: current.sortBy,
          sortDir: current.sortDir,
          setPage: current.setPage,
          setLimit: current.setLimit,
          setSearch: current.setSearch,
          setSort: current.setSort,
          extra: current.extra,
          setExtras: current.setExtras,
          clearExtras: current.clearExtras,
        },
      };
    },
  };
}

/**
 * The grouping strip's live state when the panel feature is composed.
 * Absent otherwise — the slot draws nothing.
 *
 * @param options - See {@link GroupingPanelStateOptions}.
 * @returns The state as a signal, or `undefined` when the feature is off.
 *
 * @public
 */
export function injectGroupingPanelState<TRow>(
  options: GroupingPanelStateOptions<TRow>
): Signal<GroupingPanelSlotProps<ColumnDef<TRow>>> | undefined {
  const feature = groupingPanelFeatureOf(options.features);
  if (!feature) return undefined;

  const injector = options.injector ?? inject(Injector);
  const destroyRef = injector.get(DestroyRef);
  const runtime = tableRuntimeFor(
    options.table,
    options.source,
    options.features
  );
  const extras = feature.extras ?? {};
  const controller = createGroupingPanelController({
    runtime: runtime as TableRuntime,
    groupAggregates: extras.groupAggregates,
  });
  destroyRef.onDestroy(() => {
    // Controllers hold listeners only; nothing to dispose beyond unsubscribing.
  });

  const snapshot = fromStore(
    {
      subscribe: controller.subscribe,
      getSnapshot: controller.getSnapshot,
    },
    { injector }
  );

  effect(
    () => {
      controller.configure({
        runtime: runtime as TableRuntime,
        groupAggregates: extras.groupAggregates,
      });
    },
    { injector }
  );

  const seeded = signal(false);
  effect(
    () => {
      if (seeded()) return;
      seeded.set(true);
      controller.initialize(feature.initialGroupBy);
    },
    { injector }
  );

  effect(
    () => {
      controller.reconcileKey();
      controller.reconcile();
    },
    { injector }
  );

  const declared = declaredAggregates(extras.groupAggregates);

  return computed((): GroupingPanelSlotProps<ColumnDef<TRow>> => {
    const current = options.source();
    const interactions = controller.interactions(snapshot(), declared);
    const state = groupingPanelState({
      interactions,
      groupBy: parseGroupBy(current.groupBy),
      columns: options.table.allColumns(),
      source: {
        groupAggregateOverrides: current.groupAggregateOverrides,
        setGroupAggregateOverrides: current.setGroupAggregateOverrides,
        allFilteredRows: current.allFilteredRows,
        groups: current.groups,
        capabilities: current.capabilities,
        honorsAggregates: current.honorsAggregates,
        queryAggregates: current.queryAggregates,
        aggregateOperations: current.aggregateOperations,
      },
    });
    if (!state) {
      throw new Error("grouping panel composed without interactions");
    }
    return {
      state,
      columns: options.table.allColumns(),
      labels: options.table.labels(),
      mobile: options.table.isMobile(),
      dir: options.table.dir(),
    };
  });
}
