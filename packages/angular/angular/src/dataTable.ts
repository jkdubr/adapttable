/**
 * The headless table: sorting, search, pagination, visible columns, labels
 * and the attributes every table element carries, as signals over a
 * `TableSource`. Renders nothing — the component that calls it draws
 * its own markup and applies the attributes with {@link AdaptAttrs}.
 */
import {
  columnFlexShares,
  computePagination,
  deriveSortByOptions,
  devWarn,
  type Direction,
  nextSort,
  type PaginationInfo,
  resolveLabels,
  SEARCH_DEBOUNCE_MS,
  type SortByOption,
  type SortDirection,
  type TableLabels,
  type TableSource,
  visibleColumns,
} from "@adapttable/core";
import {
  cellAttributes,
  type FeatureHostState,
  headerCellAttributes,
  headerRowAttributes,
  rowAttributes,
  searchInputAttributes,
  sortButtonAttributes,
  tableAttributes,
} from "@adapttable/core/binding";
import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  Injector,
  type Signal,
  type TemplateRef,
} from "@angular/core";

import type { Attrs } from "./attrs";
import type { AdaptCellTemplate } from "./cell";
import { type CellContext, type ColumnDef, resolveColumns } from "./columnDef";
import { type AdaptTableFeature, featureHostFor } from "./features";
import { createSearchInput } from "./searchInput";
import { type MaybeSignal, type MaybeSignalOptional, readMaybe } from "./store";

/**
 * Options for {@link injectDataTable}.
 *
 * @public
 */
export interface DataTableOptions<TRow> {
  /** The rows and view state, from `injectFrontendData` or your own tier. */
  readonly source: Signal<TableSource<TRow>>;
  /** Column definitions. */
  readonly columns: MaybeSignal<readonly ColumnDef<TRow>[]>;
  /** A row's stable id. */
  readonly rowKey: (row: TRow) => string;
  /** The table's accessible name. Defaults to the `table` label. */
  readonly tableLabel?: MaybeSignalOptional<string>;
  /** Translated labels, merged over the English defaults. */
  readonly labels?: MaybeSignalOptional<TableLabels>;
  /** Text direction. Defaults to `"ltr"`. */
  readonly dir?: MaybeSignal<Direction>;
  /** Show the mobile layout's columns. Defaults to `false`. */
  readonly forceMobile?: MaybeSignal<boolean>;
  /** Active locale for columns that read by `i18n` path. */
  readonly locale?: MaybeSignalOptional<string>;
  /** How long the search box waits after typing stops, in ms. Defaults to 300. */
  readonly searchDebounceMs?: number;
  /** Shift-click adds a column to the sort instead of replacing it. */
  readonly multiSort?: boolean;
  /** Columns share the container's width instead of overflowing it. */
  readonly fitColumns?: MaybeSignal<boolean>;
  /** User widths, which win over everything else. */
  readonly columnWidths?: MaybeSignalOptional<Readonly<Record<string, number>>>;
  /**
   * Cell templates declared in the component's own template with
   * `adaptCellTemplate` — pass `viewChildren(AdaptCellTemplate)`. A template
   * fills the cell of the column whose key it names, unless the column has
   * its own `cell`.
   */
  readonly cellTemplates?: Signal<readonly AdaptCellTemplate[]>;
  /** Features this table composes, beside the provided ones. */
  readonly features?: readonly AdaptTableFeature[];
  /** The injector to run in. Omit to use the current injection context. */
  readonly injector?: Injector;
}

/**
 * Everything a headless Angular table renders from.
 *
 * @public
 */
export interface DataTable<TRow> {
  /** The source the table reads. */
  readonly source: Signal<TableSource<TRow>>;
  /** The rows on the current page. */
  readonly rows: Signal<readonly TRow[]>;
  /** Whether there are no rows and nothing is loading. */
  readonly isEmpty: Signal<boolean>;
  /** The columns visible in the current layout, defaults filled. */
  readonly columns: Signal<readonly ColumnDef<TRow>[]>;
  /** Whether the mobile layout's columns show. */
  readonly isMobile: Signal<boolean>;
  /** Labels: English defaults with the overrides merged. */
  readonly labels: Signal<Required<TableLabels>>;
  /** Text direction. */
  readonly dir: Signal<Direction>;
  /** Page count and the visible range. */
  readonly pagination: Signal<PaginationInfo>;
  /** The active sort column. */
  readonly sortBy: Signal<string | undefined>;
  /** The active sort direction. */
  readonly sortDir: Signal<SortDirection | undefined>;
  /** Sort choices derived from the sortable columns, for a sort select. */
  readonly sortByOptions: Signal<SortByOption[]>;
  /** The committed search term. */
  readonly search: Signal<string>;
  /** What the search box shows: the term as typed, before it commits. */
  readonly searchValue: Signal<string>;
  /** The features composed on this table. */
  readonly featureHost: FeatureHostState;
  /** Advance a column's sort: ascending, descending, then off. */
  readonly toggleSort: (key: string) => void;
  /** Commit a search term now, trimmed. */
  readonly setSearch: (term: string) => void;
  /** Type into the search box; the term commits once typing pauses. */
  readonly setSearchValue: (text: string) => void;
  /** Go to a 1-based page. */
  readonly setPage: (page: number) => void;
  /** Change the page size. */
  readonly setLimit: (limit: number) => void;
  /** A row's stable id. */
  readonly rowKey: (row: TRow) => string;
  /** A cell's accessor value. */
  readonly cellValue: (column: ColumnDef<TRow>, row: TRow) => unknown;
  /** The `<table>` element's attributes. */
  readonly tableAttrs: () => Attrs;
  /** The header row's attributes. */
  readonly headerRowAttrs: () => Attrs;
  /** A header cell's attributes: scope, sort state, alignment and size. */
  readonly headerCellAttrs: (column: ColumnDef<TRow>) => Attrs;
  /** A column's sort control: type, name, sort index and its click. */
  readonly sortButtonAttrs: (column: ColumnDef<TRow>) => Attrs;
  /** A body row's attributes. */
  readonly rowAttrs: (row: TRow, index: number) => Attrs;
  /** A body cell's attributes. */
  readonly cellAttrs: (column: ColumnDef<TRow>) => Attrs;
  /**
   * The search box's attributes: its text, and an input handler that commits
   * the term once typing pauses.
   */
  readonly searchInputAttrs: () => Attrs;
}

/**
 * The headless table for an Angular component.
 *
 * @param options - See {@link DataTableOptions}.
 * @returns Signals and attribute getters; see {@link DataTable}.
 *
 * @public
 */
export function injectDataTable<TRow>(
  options: DataTableOptions<TRow>
): DataTable<TRow> {
  if (!options.injector) assertInInjectionContext(injectDataTable);
  const injector = options.injector ?? inject(Injector);
  const { source, rowKey } = options;

  const labels = computed(() =>
    resolveLabels(options.labels && readMaybe(options.labels))
  );
  const dir = computed(() => readMaybe(options.dir ?? "ltr"));
  const isMobile = computed(() => readMaybe(options.forceMobile ?? false));
  const columnWidths = computed(
    () => options.columnWidths && readMaybe(options.columnWidths)
  );

  const allColumns = computed(() => {
    const templates = options.cellTemplates?.() ?? [];
    const declared = readMaybe(options.columns).map((column) => {
      if (column.cell) return column;
      const template = templates.find(
        (candidate) => candidate.key() === column.key
      );
      return template
        ? {
            ...column,
            cell: template.template as TemplateRef<CellContext<TRow>>,
          }
        : column;
    });
    return resolveColumns(
      declared,
      options.locale && readMaybe(options.locale)
    );
  });

  // Duplicate keys corrupt sorting, selection and column layout — every
  // feature targets columns by key.
  effect(
    () => {
      const seen = new Set<string>();
      for (const column of allColumns()) {
        if (seen.has(column.key)) {
          devWarn(
            `duplicate column key "${column.key}" — column keys must be unique; sorting, selection, and column layout all target keys.`
          );
        }
        seen.add(column.key);
      }
    },
    { injector }
  );

  const columns = computed(() =>
    visibleColumns(allColumns(), isMobile() ? "mobile" : "desktop")
  );
  const flexShares = computed(() =>
    columnFlexShares({
      columns: columns(),
      fitColumns: readMaybe(options.fitColumns ?? false),
      widths: columnWidths(),
    })
  );
  const sizing = computed(() => ({
    flexShares: flexShares(),
    columnWidths: columnWidths(),
  }));

  const search = computed(() => source().search);
  const searchInput = createSearchInput(
    search,
    (term) => {
      source().setSearch(term);
    },
    options.searchDebounceMs ?? SEARCH_DEBOUNCE_MS,
    injector
  );

  const toggleSort = (key: string): void => {
    const current = source();
    const next = nextSort({ key: current.sortBy, dir: current.sortDir }, key);
    current.setSort(next.key, next.dir);
  };

  return {
    source,
    rows: computed(() => source().rows),
    isEmpty: computed(() => source().rows.length === 0 && !source().isLoading),
    columns,
    isMobile,
    labels,
    dir,
    pagination: computed(() => {
      const { page, limit, total } = source();
      return computePagination({ page, limit, total });
    }),
    sortBy: computed(() => source().sortBy),
    sortDir: computed(() => source().sortDir),
    sortByOptions: computed(() => deriveSortByOptions(columns())),
    search,
    searchValue: searchInput.value,
    featureHost: featureHostFor(injector, options.features),
    toggleSort,
    setSearch: searchInput.commit,
    setSearchValue: searchInput.setValue,
    setPage: (page) => {
      source().setPage(page);
    },
    setLimit: (limit) => {
      source().setLimit(limit);
    },
    rowKey,
    cellValue: (column, row) => column.accessor?.(row) ?? null,
    tableAttrs: () =>
      tableAttributes(
        dir(),
        (options.tableLabel && readMaybe(options.tableLabel)) ?? labels().table
      ),
    headerRowAttrs: () => headerRowAttributes(),
    headerCellAttrs: (column) => {
      const { sortBy, sortDir, sortLevels } = source();
      return headerCellAttributes(
        column,
        { sortBy, sortDir, sortLevels },
        sizing()
      );
    },
    sortButtonAttrs: (column) =>
      sortButtonAttributes(column, {
        sortLevels: source().sortLevels,
        sortByLabel: labels().sortBy,
        multiSort: options.multiSort,
        toggleSort,
        toggleSortLevel: (key) => {
          source().toggleSortLevel(key);
        },
      }),
    rowAttrs: (row, index) => rowAttributes(rowKey(row), index, undefined),
    cellAttrs: (column) => cellAttributes(column, sizing()),
    searchInputAttrs: () =>
      searchInputAttributes(
        searchInput.value(),
        labels(),
        searchInput.setValue
      ),
  };
}
