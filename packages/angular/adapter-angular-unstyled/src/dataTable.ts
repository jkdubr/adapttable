/**
 * The unstyled Angular table: semantic HTML with `data-adapttable-part`
 * hooks and no styles of its own, over `@adapttable/angular`. Native HTML is
 * this kit's kit, so every control a reader uses is the browser's own.
 */
import {
  ACTIONS_COLUMN_KEY,
  ACTIVE_FILTER_CHIPS,
  type ActiveFilterChip,
  AdaptAttrs,
  AdaptCell,
  AdaptCellTemplate,
  AdaptHeader,
  AdaptIcon,
  AdaptLiveRegion,
  AdaptSlot,
  type AdaptTableFeature,
  BULK_BAR,
  type BulkAction,
  type BulkBarSlotProps,
  COLUMN_MENU,
  type ColumnDef,
  type ColumnLayoutState,
  type ColumnMenuSlotProps,
  type ConfirmHandler,
  type DataTable,
  defaultConfirm,
  devWarn,
  type Direction,
  type ExportCsvOptions,
  type ExtraFilters,
  featureOptionsOf,
  FILTER_DRAWER,
  FILTER_HEADER,
  FILTER_POPOVER,
  type FilterDef,
  filterRuntimeFor,
  FILTERS_FORM,
  FILTERS_ICON,
  type FilterTypeSpec,
  type GridFocus,
  GROUPING_PANEL,
  type GroupingPanelSlotProps,
  injectDataTable,
  injectDensity,
  injectExportCsv,
  injectFrontendData,
  injectFullscreen,
  injectGridFocus,
  injectGroupingPanelState,
  injectIsMobile,
  injectRowSelection,
  injectTableVirtualization,
  isBodyEligible,
  type PaginationMode,
  type RowAction,
  rowActionsFor,
  type RowActionsLayout,
  type RowSelection,
  SAVED_VIEWS,
  type SavedViewsControllerOptions,
  type SavedViewsSlotProps,
  type SelectionState,
  type TableDensity,
  type TableLabels,
  type TableQueryParams,
  type TableVirtualization,
  TOOLBAR_EXTRAS,
  type ToolbarExtrasSlotProps,
  urlAdapterFor,
  virtualColumnSpan,
  virtualizeIgnoredOnPage,
} from "@adapttable/angular";
import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  type ElementRef,
  inject,
  Injector,
  input,
  type OnInit,
  output,
  type Signal,
  signal,
  type TemplateRef,
  viewChild,
} from "@angular/core";

import { AdaptRowActions } from "./actions";
import {
  type FiltersMode,
  type FiltersView,
  filtersViewFor,
} from "./tableFilters";

/**
 * The body window for a composed {@link virtualize} feature, or every row
 * when the feature is absent.
 */
function bodyVirtualizationFor<TRow>(options: {
  readonly table: DataTable<TRow>;
  readonly source: Signal<ReturnType<DataTable<TRow>["source"]>>;
  readonly featureOptions: Readonly<Record<string, unknown>>;
  readonly rowKey: (row: TRow) => string;
  readonly maxHeight: number | string | undefined;
  readonly scrollBox: () => HTMLElement | null;
  readonly injector: Injector;
}): Signal<TableVirtualization<TRow>> {
  const {
    table,
    source,
    featureOptions,
    rowKey,
    maxHeight,
    scrollBox,
    injector,
  } = options;
  const wantVirtualize = featureOptions.virtualize === true;
  const bodyChrome = computed(() => ({
    body: table.bodyRegion(),
    isPaged: source().paginationMode === "paged",
    source: source(),
    grouping: undefined,
    tree: undefined,
    isMobile: table.isMobile(),
  }));
  if (wantVirtualize && virtualizeIgnoredOnPage(true, bodyChrome())) {
    devWarn(
      'virtualize only applies in infinite mode — this paged table renders unvirtualized. Pass paginationMode="infinite" to enable it, or group the rows: an expanded page is windowed.'
    );
  }
  if (!wantVirtualize) {
    return computed(() => ({
      enabled: false,
      rows: source().rows.map((row, index) => ({
        row,
        index,
        key: rowKey(row),
      })),
      paddingTop: 0,
      paddingBottom: 0,
    }));
  }
  const estimateRowSize =
    typeof featureOptions.estimateRowSize === "number"
      ? featureOptions.estimateRowSize
      : 56;
  const estimateCardSize =
    typeof featureOptions.estimateCardSize === "number"
      ? featureOptions.estimateCardSize
      : 140;
  const virtualOverscan =
    typeof featureOptions.virtualOverscan === "number"
      ? featureOptions.virtualOverscan
      : undefined;
  const virtualScrollMargin =
    typeof featureOptions.virtualScrollMargin === "number"
      ? featureOptions.virtualScrollMargin
      : undefined;
  return injectTableVirtualization<TRow>({
    rows: computed(() => source().rows),
    rowKey,
    enabled: computed(() => isBodyEligible(bodyChrome())),
    estimateSize: computed(() =>
      table.isMobile() ? estimateCardSize : estimateRowSize
    ),
    overscan: virtualOverscan,
    scrollMargin: virtualScrollMargin,
    getScrollElement: maxHeight != null ? () => scrollBox() : undefined,
    onEndReached: () => {
      table.loadMore();
    },
    injector,
  });
}

/**
 * What the table renders from once its inputs have arrived.
 *
 * @public
 */
export interface TableView<TRow> {
  /** The headless table. */
  readonly table: DataTable<TRow>;
  /** Row selection, when the table is selectable. */
  readonly selection: RowSelection | undefined;
  /** Cell navigation, when it is on. */
  readonly grid: GridFocus<TRow> | undefined;
  /** Whether the Columns menu is composed. */
  readonly columnMenu: boolean;
  /** The Columns menu's props. */
  readonly columnMenuProps: Signal<ColumnMenuSlotProps<never>>;
  /** The filters, when a filters feature is composed. */
  readonly filters: FiltersView | undefined;
  /** The selection bar's props, when bulk actions are composed. */
  readonly bulkBar: Signal<BulkBarSlotProps<SelectionState>> | undefined;
  /** The actions column's list, absent while hidden or empty. */
  readonly rowActions: Signal<RowAction<TRow>[] | undefined>;
  /** A strip of buttons, or a menu. */
  readonly rowActionsLayout: RowActionsLayout | undefined;
  /** Asks before an action that declares a `confirm`. */
  readonly confirm: ConfirmHandler;
  /** The row density the root states. */
  readonly density: Signal<TableDensity>;
  /** The toolbar extras' props: density, fullscreen and export. */
  readonly toolbarExtras: Signal<ToolbarExtrasSlotProps>;
  /** The saved-views menu's props, when it is composed. */
  readonly savedViews:
    Signal<SavedViewsSlotProps<SavedViewsControllerOptions>> | undefined;
  /** The grouping strip's props, when the panel feature is composed. */
  readonly groupingPanel:
    Signal<GroupingPanelSlotProps<ColumnDef<TRow>>> | undefined;
  /** The body window — every row when virtualization is off. */
  readonly virtualization: Signal<TableVirtualization<TRow>>;
  /** Column span for spacer/detail cells. */
  readonly bodyColSpan: Signal<number>;
}

/**
 * The unstyled AdaptTable for Angular: search, sorting, paging, the phone
 * card layout, row selection and keyboard cell navigation, drawn with native
 * elements that carry the `data-adapttable-part` names every kit shares.
 *
 * @public
 */
@Component({
  selector: "adapt-data-table",
  imports: [
    NgTemplateOutlet,
    AdaptRowActions,
    AdaptAttrs,
    AdaptCell,
    AdaptHeader,
    AdaptIcon,
    AdaptLiveRegion,
    AdaptSlot,
  ],
  templateUrl: "./dataTable.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdaptDataTable<TRow> implements OnInit {
  /** Every row. The host owns the array. */
  readonly data = input.required<readonly TRow[]>();
  /** The columns, in order. */
  readonly columns = input.required<readonly ColumnDef<TRow>[]>();
  /** A row's stable id. */
  readonly rowKey = input.required<(row: TRow) => string>();
  /** The table's accessible name. Defaults to the `table` label. */
  readonly tableLabel = input<string>();
  /** Text direction. */
  readonly dir = input<Direction>("ltr");
  /** Show the phone layout whatever the viewport. */
  readonly forceMobile = input<boolean>();
  /** Translated labels, merged over the English defaults. */
  readonly labels = input<TableLabels>();
  /** The search box's placeholder. Defaults to the `searchPlaceholder` label. */
  readonly searchPlaceholder = input<string>();
  /** Keep the view state in the URL. Read once, when the table starts. */
  readonly urlSync = input(true);
  /** Namespace for this table's URL params. Read once. */
  readonly urlKey = input<string>();
  /** Initial view state while the URL is silent. Read once. */
  readonly defaults = input<
    Partial<TableQueryParams> & { extra?: ExtraFilters }
  >();
  /**
   * Pagination mode. Defaults to `"auto"` (phone → infinite). Pass
   * `"infinite"` with {@link virtualize} so the body windows.
   * Read once.
   */
  readonly paginationMode = input<PaginationMode>();
  /**
   * Cap the table body's height; the body scrolls inside the box and a
   * composed {@link virtualize} tracks the box instead of the page.
   */
  readonly maxHeight = input<number | string>();
  /** Offer a checkbox on every row. Read once. */
  readonly selectable = input(false);
  /** The selected row ids, to control the selection. */
  readonly selectedIds = input<readonly string[]>();
  /**
   * Arrow keys move between cells. Read once. Prefer composing
   * `cellNavigation()` when listing features; this input still toggles the
   * grid alone.
   */
  readonly cellNavigation = input(false);
  /**
   * The features this table composes, such as `columnMenu()`. Read once,
   * when the table starts.
   */
  readonly features = input<readonly AdaptTableFeature[]>([]);
  /** The column layout, to control it. */
  readonly columnLayout = input<ColumnLayoutState>();
  /** The layout an uncontrolled table starts from. Read once. */
  readonly defaultColumnLayout = input<Partial<ColumnLayoutState>>();
  /**
   * Called when the user renames a column. With it, the Columns menu offers
   * a rename. Read once.
   */
  readonly onColumnRename = input<(key: string, name: string) => void>();
  /**
   * Where the Filters button opens its panel: an anchored popover with no
   * backdrop, or a drawer that dims the page. Read once.
   */
  readonly filtersMode = input<FiltersMode>("popover");
  /** Close a header filter once a single-control write finishes. Read once. */
  readonly closeHeaderFilterOnSelect = input(false);
  /** The host's own chips, shown after the table's filter chips. */
  readonly extraChips = input<readonly ActiveFilterChip[]>([]);
  /** Row density while the URL says nothing. Read once. */
  readonly density = input<TableDensity>();
  /**
   * Asks before an action that declares a `confirm`. Defaults to the
   * browser's `confirm`. Read once.
   */
  readonly confirm = input<ConfirmHandler>();
  /** Every selection change, as the full list of selected ids. */
  readonly selectionChange = output<string[]>();
  /** Every column-layout change. */
  readonly columnLayoutChange = output<ColumnLayoutState>();

  /**
   * Cell templates the host declares inside the table's element.
   *
   * @internal
   */
  protected readonly cellTemplates = contentChildren(AdaptCellTemplate);
  /**
   * The table, once `ngOnInit` has read the inputs it starts from.
   *
   * @internal
   */
  protected readonly view = signal<TableView<TRow> | undefined>(undefined);
  /**
   * Whether the empty table is empty because nothing matched.
   *
   * @internal
   */
  protected readonly noResults = computed(
    () => this.view()?.table.emptyVariant() === "noResults"
  );

  /** The Columns menu's slot. @internal */
  protected readonly columnMenuSlot = COLUMN_MENU;
  /** The filter slots. @internal */
  protected readonly filterSlots = {
    form: FILTERS_FORM,
    popover: FILTER_POPOVER,
    drawer: FILTER_DRAWER,
    chips: ACTIVE_FILTER_CHIPS,
    header: FILTER_HEADER,
  };
  /** The saved-views slot. @internal */
  protected readonly savedViewsSlot = SAVED_VIEWS;
  /** The toolbar extras' slot. @internal */
  protected readonly toolbarExtrasSlot = TOOLBAR_EXTRAS;
  /** The selection bar's slot. @internal */
  protected readonly bulkBarSlot = BULK_BAR;
  /** The grouping strip's slot. @internal */
  protected readonly groupingPanelSlot = GROUPING_PANEL;
  /** The Filters button's glyph. @internal */
  protected readonly filtersIcon = FILTERS_ICON;
  /**
   * The scroll box that owns `maxHeight`, when virtualization tracks it.
   *
   * @internal
   */
  protected readonly scrollBox =
    viewChild<ElementRef<HTMLElement>>("scrollBox");
  private readonly filtersForm = viewChild<TemplateRef<unknown>>("filtersForm");
  private readonly filtersTrigger =
    viewChild<TemplateRef<unknown>>("filtersTrigger");
  private readonly injector = inject(Injector);
  private readonly root = viewChild<ElementRef<HTMLElement>>("root");

  /**
   * A row's id, for `@for` to track rows by. A track expression reads only
   * the item and the component, not a template alias.
   *
   * @internal
   */
  protected rowId(row: TRow): string {
    return this.rowKey()(row);
  }

  /**
   * Style for the scroll box when `maxHeight` is set.
   *
   * @internal
   */
  protected scrollBoxStyle(): Record<string, string> | null {
    const maxHeight = this.maxHeight();
    if (maxHeight == null) return null;
    return {
      maxHeight:
        typeof maxHeight === "number" ? `${String(maxHeight)}px` : maxHeight,
      overflow: "auto",
    };
  }

  /** Start the table from the inputs it reads once. */
  ngOnInit(): void {
    const injector = this.injector;
    const labels = computed((): TableLabels | undefined => {
      const placeholder = this.searchPlaceholder();
      return placeholder === undefined
        ? this.labels()
        : { ...this.labels(), searchPlaceholder: placeholder };
    });
    const features = this.features();
    const featureOptions = featureOptionsOf(features);
    const declaredFilters = featureOptions.filters;
    const filtersOn = Array.isArray(declaredFilters);
    const headerOn = featureOptions.headerFilters === true;
    const runtime =
      filtersOn || headerOn
        ? filterRuntimeFor<TRow>({
            columns: this.columns,
            defs: filtersOn
              ? (declaredFilters as FilterDef<TRow>[])
              : undefined,
            data: this.data,
            filterTypes: featureOptions.filterTypes as
              FilterTypeSpec[] | undefined,
          })
        : undefined;
    // Filled once the table exists; the table reads the count lazily.
    const filtersRef: { current?: FiltersView } = {};
    // One URL backend for the table, its density and its saved views — a
    // private memory store when the table does not sync with the URL.
    const urlAdapter = urlAdapterFor({ urlSync: this.urlSync() }, injector);
    const viewportMobile = injectIsMobile({ injector });
    const isMobile = computed(() => this.forceMobile() ?? viewportMobile());
    const source = injectFrontendData<TRow>({
      data: this.data,
      columns: this.columns,
      getRowId: (row) => this.rowKey()(row),
      forceMobile: isMobile,
      urlAdapter,
      urlKey: this.urlKey(),
      defaults: this.defaults(),
      paginationMode: this.paginationMode(),
      filterFn: runtime?.filterFn,
      filterTreeFn: runtime?.filterTreeFn,
      arrayExtraKeys: runtime?.arrayExtraKeys,
      numberExtraKeys: runtime?.numberExtraKeys,
      injector,
    });
    const declaredBulk = featureOptions.bulkActions;
    const bulk = Array.isArray(declaredBulk)
      ? (declaredBulk as BulkAction[])
      : undefined;
    const selection =
      this.selectable() || bulk
        ? injectRowSelection<TRow>({
            rows: computed(() => source().rows),
            rowKey: (row) => this.rowKey()(row),
            selectedIds: this.selectedIds,
            onSelectionChange: (ids) => {
              this.selectionChange.emit(ids);
            },
            labels,
          })
        : undefined;
    const table = injectDataTable<TRow>({
      source,
      columns: this.columns,
      rowKey: (row) => this.rowKey()(row),
      tableLabel: this.tableLabel,
      labels,
      dir: this.dir,
      forceMobile: isMobile,
      cellTemplates: this.cellTemplates,
      selection,
      features,
      activeFilterCount: computed(() => filtersRef.current?.count() ?? 0),
      columnLayout: this.columnLayout,
      onColumnLayoutChange: (next) => {
        this.columnLayoutChange.emit(next);
      },
      defaultColumnLayout: this.defaultColumnLayout(),
      onColumnRename: this.onColumnRename(),
      injector,
    });
    const filters = runtime
      ? filtersViewFor({
          table,
          source,
          runtime: runtime.runtime,
          mode: this.filtersMode(),
          button: filtersOn,
          header: headerOn,
          closeHeaderFilterOnSelect: this.closeHeaderFilterOnSelect(),
          dir: table.dir,
          extraChips: this.extraChips,
          form: this.filtersForm,
          trigger: this.filtersTrigger,
        })
      : undefined;
    filtersRef.current = filters;
    const confirm = this.confirm() ?? defaultConfirm;
    const rowActions = rowActionsFor<TRow>({
      actions: featureOptions.rowActions as RowAction<TRow>[] | undefined,
      onDuplicateRow: featureOptions.onDuplicateRow as
        ((row: TRow) => void) | undefined,
      onDeleteRow: featureOptions.onDeleteRow as
        ((row: TRow) => void) | undefined,
      confirmDeleteRow: featureOptions.confirmDeleteRow as boolean | undefined,
      labels: table.labels,
      hidden: computed(() => table.layout().isHidden(ACTIONS_COLUMN_KEY)),
    });
    const bulkBar =
      bulk && selection
        ? computed((): BulkBarSlotProps<SelectionState> => ({
            selection: selection.state(),
            total: source().total,
            bulkActions: bulk,
            confirm,
            labels: table.labels(),
          }))
        : undefined;
    const grid =
      this.cellNavigation() || featureOptions.cellNavigation === true
        ? injectGridFocus({ table, enabled: true, injector })
        : undefined;
    const root = (): HTMLElement | null => this.root()?.nativeElement ?? null;
    const densityState =
      featureOptions.densityChooser === true
        ? injectDensity({
            urlAdapter,
            urlKey: this.urlKey(),
            defaultDensity: this.density(),
            injector,
          })
        : undefined;
    const fixedDensity = this.density() ?? "comfortable";
    const density = densityState?.density ?? computed(() => fixedDensity);
    const fullscreen =
      featureOptions.fullscreen === true
        ? injectFullscreen(
            computed(() => this.root()?.nativeElement),
            injector
          )
        : undefined;
    const exportOption = featureOptions.exportCsv as
      boolean | ExportCsvOptions<TRow> | undefined;
    const exporter =
      exportOption === undefined || exportOption === false
        ? undefined
        : injectExportCsv<TRow>({
            exportCsv: exportOption,
            source,
            columns: table.columns,
            labels: table.labels,
            featureHost: table.featureHost,
            injector,
          });
    const savedViewsOption = featureOptions.savedViews as
      SavedViewsControllerOptions | undefined;
    const savedViews = savedViewsOption
      ? computed((): SavedViewsSlotProps<SavedViewsControllerOptions> => ({
          // The views capture and apply through the table's own backend
          // and namespace; the host's explicit values still win.
          options: {
            urlAdapter,
            urlKey: this.urlKey(),
            ...savedViewsOption,
          },
          labels: table.labels(),
        }))
      : undefined;
    const toolbarExtras = computed((): ToolbarExtrasSlotProps => ({
      density: density(),
      onDensityChange: (next) => {
        densityState?.setDensity(next);
      },
      onToggleFullscreen: fullscreen?.().supported
        ? fullscreen().toggle
        : undefined,
      isFullscreen: fullscreen?.().active,
      ...exporter?.(),
      labels: table.labels(),
    }));
    const columnMenuProps = computed((): ColumnMenuSlotProps<never> => ({
      allColumns: table.allColumns() as never,
      layout: table.layout(),
      labels: table.labels(),
      dir: table.dir(),
      sortBy: table.sortBy(),
      sortDir: table.sortDir(),
      onAutoSize: () => {
        table.autoSizeColumns(root());
      },
      onAutoSizeColumn: (key) => {
        table.autoSizeColumn(root(), key);
      },
      onSortColumn: (key, dir) => {
        table.source().setSort(key, dir);
      },
      onRenameColumn: this.onColumnRename()
        ? table.layout().setName
        : undefined,
      hasRowActions: rowActions().hasRowActions,
    }));
    const groupingPanel = injectGroupingPanelState({
      table,
      source,
      features,
      injector,
    });
    const virtualization = bodyVirtualizationFor({
      table,
      source,
      featureOptions,
      rowKey: (row) => this.rowKey()(row),
      maxHeight: this.maxHeight(),
      scrollBox: () => this.scrollBox()?.nativeElement ?? null,
      injector,
    });
    const bodyColSpan = computed(() =>
      virtualColumnSpan(
        table.columns().length,
        selection !== undefined,
        rowActions().hasRowActions
      )
    );
    this.view.set({
      table,
      selection,
      grid,
      columnMenu: table.featureOptions.enableColumnMenu === true,
      columnMenuProps,
      filters,
      bulkBar,
      rowActions: computed(() => rowActions().rowActions),
      density,
      toolbarExtras,
      savedViews,
      groupingPanel,
      virtualization,
      bodyColSpan,
      rowActionsLayout: featureOptions.rowActionsLayout as
        RowActionsLayout | undefined,
      confirm,
    });
  }
}
