/**
 * Declarative filters for Angular: the runtime core derives from the
 * definitions (the predicate, the URL keys, the chip labels), the chips for
 * what is active, and the per-field widgets a kit's form draws — as signals.
 *
 * Built only when a table composes `filters(...)`; a table without it never
 * calls any of this.
 */
import {
  type ActiveFilterChip,
  activeFilterChips,
  type BooleanFieldWidget,
  booleanFilterWidget,
  chipValuesOf,
  type ColumnMetadata,
  devWarn,
  type ExtraFilters,
  FILTER_ENGINE_IMPL,
  type FilterDef,
  type FilterOption,
  type FilterRuntime,
  filterTreeChipLabel,
  type FilterTypeSpec,
  type FilterValue,
  initialRangeFilterOp,
  initialTextFilterOp,
  mergeFilterChips,
  type QueryFilterGroup,
  type RangeFieldWidget,
  rangeFilterWidget,
  type RangeOp,
  removeFilterTreeNode,
  type TableLabels,
  type TableSource,
  type TextFieldWidget,
  textFilterWidget,
  type TextOp,
  walkFilterTreeConditions,
} from "@adapttable/core";
import type { FeatureHostState } from "@adapttable/core/binding";
import {
  computed,
  DestroyRef,
  type Injector,
  type Signal,
  signal,
  untracked,
} from "@angular/core";

import { type MaybeSignal, readMaybe } from "../store";

/**
 * Options for {@link filterRuntimeFor}.
 *
 * @public
 */
export interface FilterRuntimeOptions<TRow> {
  /** The table's columns; a column's `filter` becomes a definition. */
  readonly columns: MaybeSignal<readonly ColumnMetadata<TRow>[]>;
  /** The declared definitions, from `filters(defs)`. */
  readonly defs: readonly FilterDef<TRow>[] | undefined;
  /** Every row, for `options: "auto"`. */
  readonly data: MaybeSignal<readonly TRow[]>;
  /** Custom filter types, from `filterTypes(...)`. */
  readonly filterTypes?: readonly FilterTypeSpec[];
  /** Active locale for columns that read by `i18n` path. */
  readonly locale?: Signal<string | undefined>;
  /** The table's feature host, once it has one. */
  readonly featureHost?: Signal<FeatureHostState | undefined>;
}

/**
 * The derived filter runtime.
 *
 * @public
 */
export interface TableFilters<TRow> {
  /** The merged definitions, the registry, the chip labels and the predicate. */
  readonly runtime: Signal<FilterRuntime<TRow>>;
  /** The predicate over the filter bag, for `injectFrontendData`'s `filterFn`. */
  readonly filterFn: (row: TRow, extra: ExtraFilters) => boolean;
  /** The predicate over the filter tree, for `filterTreeFn`. */
  readonly filterTreeFn: (row: TRow, tree: QueryFilterGroup) => boolean;
  /** Filter keys whose URL values are lists, for the URL state. */
  readonly arrayExtraKeys: readonly string[];
  /** Filter keys whose URL values are numbers, for the URL state. */
  readonly numberExtraKeys: readonly string[];
}

/**
 * The filter runtime for a table's definitions and columns.
 *
 * @param options - See {@link FilterRuntimeOptions}.
 * @returns The runtime; see {@link TableFilters}.
 *
 * @public
 */
export function filterRuntimeFor<TRow>(
  options: FilterRuntimeOptions<TRow>
): TableFilters<TRow> {
  const optionCache = new Map<
    string,
    () => Promise<readonly { value: string; label: string }[]>
  >();
  const runtime = computed(() =>
    FILTER_ENGINE_IMPL.buildRuntime({
      columns: readMaybe(options.columns),
      declaredFilters: options.defs,
      locale: options.locale?.(),
      data: readMaybe(options.data),
      loadedOptions: {},
      filterTypes: options.filterTypes,
      featureHost: options.featureHost?.(),
      optionCache,
    })
  );
  // The URL store reads its list and number keys once, when it is made.
  const first = untracked(runtime);
  return {
    runtime,
    filterFn: (row, extra) => runtime().filterFn(row, extra),
    filterTreeFn: (row, tree) => {
      const current = runtime();
      return FILTER_ENGINE_IMPL.evaluateTree(
        tree,
        row,
        current.defs,
        current.registry
      );
    },
    arrayExtraKeys: first.arrayExtraKeys,
    numberExtraKeys: first.numberExtraKeys,
  };
}

/**
 * The chips for every active filter — the bag's and the tree's, then the
 * host's own — and how many filters are set.
 *
 * @param source - The table's source.
 * @param runtime - The filter runtime.
 * @param labels - Resolved labels.
 * @param extraChips - The host's own chips, appended.
 * @returns The chips and the count.
 *
 * @public
 */
export function filterChipsFor<TRow>(
  source: Signal<TableSource<TRow>>,
  runtime: Signal<FilterRuntime<TRow>>,
  labels: Signal<Required<TableLabels>>,
  extraChips: MaybeSignal<readonly ActiveFilterChip[]> = []
): Signal<{
  readonly chips: readonly ActiveFilterChip[];
  readonly count: number;
}> {
  return computed(() => {
    const current = source();
    const { filterLabels, defs, registry } = runtime();
    const bag = activeFilterChips({
      values: chipValuesOf(current.extra, filterLabels),
      labels: filterLabels,
      onChange: (key: string, next: FilterValue) => {
        current.setExtra(key, next ?? "");
      },
    });
    const tree = current.filterTree;
    const setTree = current.setFilterTree;
    const treeChips: ActiveFilterChip[] =
      tree && setTree
        ? walkFilterTreeConditions(tree).map(({ condition, path }) => ({
            key: `ft:${path.join(".")}:${condition.key}:${condition.op}`,
            label: filterTreeChipLabel(condition, defs, labels(), registry),
            onRemove: () => {
              setTree(removeFilterTreeNode(tree, path));
            },
          }))
        : [];
    const chips = mergeFilterChips(
      mergeFilterChips(bag, treeChips),
      readMaybe(extraChips)
    );
    return { chips, count: chips.length };
  });
}

/**
 * A filter's choices, resolved: a static list as is, an async loader's once
 * it settles, and nothing for `"auto"` on a tier without every row.
 *
 * @public
 */
export interface FilterOptionsState {
  /** The choices. */
  readonly options: readonly FilterOption[];
  /** Whether a loader is still running. */
  readonly loading: boolean;
}

const NO_OPTIONS: readonly FilterOption[] = [];

/**
 * A definition's choices as a signal, loading them when they come from a
 * loader.
 *
 * @param def - The definition.
 * @param injector - Ends a load in flight when the caller is destroyed.
 * @returns The choices and whether they are loading.
 *
 * @public
 */
export function filterOptionsFor<TRow>(
  def: Pick<FilterDef<TRow>, "key" | "options">,
  injector: Injector
): Signal<FilterOptionsState> {
  const source = def.options;
  if (Array.isArray(source)) {
    return signal({ options: source, loading: false }).asReadonly();
  }
  if (typeof source !== "function") {
    if (source === "auto") {
      devWarn(
        `filter "${def.key}" uses options: "auto" on a tier with no full dataset — provide an options array or loader.`
      );
    }
    return signal({ options: NO_OPTIONS, loading: false }).asReadonly();
  }
  const state = signal<FilterOptionsState>({
    options: NO_OPTIONS,
    loading: true,
  });
  let alive = true;
  injector.get(DestroyRef).onDestroy(() => {
    alive = false;
  });
  source().then(
    (options) => {
      if (alive) state.set({ options, loading: false });
    },
    () => {
      if (!alive) return;
      devWarn(`async options for filter "${def.key}" failed to load.`);
      state.set({ options: NO_OPTIONS, loading: false });
    }
  );
  return state.asReadonly();
}

/**
 * A text filter's field: its operator, kept while the value is empty, and
 * the value, written to the filter bag. The definition and the source may be
 * a component's inputs: nothing is read until the field is.
 *
 * @public
 */
export function textFilterFor<TRow>(
  def: MaybeSignal<FilterDef<TRow>>,
  source: Signal<TableSource<TRow>>
): Signal<TextFieldWidget> {
  const chosen = signal<TextOp | undefined>(undefined);
  const setOp = (next: TextOp): void => {
    chosen.set(next);
  };
  return computed(() => {
    const current = readMaybe(def);
    const op = chosen() ?? initialTextFilterOp(current, source().extra);
    return textFilterWidget(current, source(), op, setOp);
  });
}

/**
 * A number or date range filter's field: its operator and its bounds.
 *
 * @public
 */
export function rangeFilterFor<TRow>(
  def: MaybeSignal<FilterDef<TRow>>,
  source: Signal<TableSource<TRow>>
): Signal<RangeFieldWidget> {
  // `null` is "the reader cleared the operator"; `undefined` is "not chosen
  // yet", which reads the operator the filter bag already holds.
  const chosen = signal<RangeOp | null | undefined>(undefined);
  const setOp = (next: RangeOp | undefined): void => {
    chosen.set(next ?? null);
  };
  return computed(() => {
    const current = readMaybe(def);
    const picked = chosen();
    const op =
      picked === undefined
        ? initialRangeFilterOp(current, source().extra)
        : (picked ?? undefined);
    return { ...rangeFilterWidget(current, source(), op), setOp };
  });
}

/**
 * A yes/no filter's field.
 *
 * @public
 */
export function booleanFilterFor<TRow>(
  def: MaybeSignal<FilterDef<TRow>>,
  source: Signal<TableSource<TRow>>
): Signal<BooleanFieldWidget> {
  return computed(() => booleanFilterWidget(readMaybe(def), source()));
}
