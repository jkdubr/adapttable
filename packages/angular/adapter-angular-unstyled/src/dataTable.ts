/**
 * The unstyled Angular table: semantic HTML with `data-adapttable-part`
 * hooks and no styles of its own, over `@adapttable/angular`. Native HTML is
 * this kit's kit, so every control a reader uses is the browser's own.
 */
import {
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
  COLUMN_MENU,
  type ColumnDef,
  type ColumnLayoutState,
  type ColumnMenuSlotProps,
  type DataTable,
  type Direction,
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
  injectDataTable,
  injectFrontendData,
  injectGridFocus,
  injectIsMobile,
  injectRowSelection,
  type RowSelection,
  type TableLabels,
  type TableQueryParams,
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

import {
  type FiltersMode,
  type FiltersView,
  filtersViewFor,
} from "./tableFilters";

/**
 * What the table renders from once its inputs have arrived.
 *
 * @internal
 */
interface TableView<TRow> {
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
  /** Offer a checkbox on every row. Read once. */
  readonly selectable = input(false);
  /** The selected row ids, to control the selection. */
  readonly selectedIds = input<readonly string[]>();
  /** Arrow keys move between cells. Read once. */
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
  /** The Filters button's glyph. @internal */
  protected readonly filtersIcon = FILTERS_ICON;
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
    const viewportMobile = injectIsMobile({ injector });
    const isMobile = computed(() => this.forceMobile() ?? viewportMobile());
    const source = injectFrontendData<TRow>({
      data: this.data,
      columns: this.columns,
      getRowId: (row) => this.rowKey()(row),
      forceMobile: isMobile,
      urlSync: this.urlSync(),
      urlKey: this.urlKey(),
      defaults: this.defaults(),
      filterFn: runtime?.filterFn,
      filterTreeFn: runtime?.filterTreeFn,
      arrayExtraKeys: runtime?.arrayExtraKeys,
      numberExtraKeys: runtime?.numberExtraKeys,
      injector,
    });
    const selection = this.selectable()
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
    const grid = this.cellNavigation()
      ? injectGridFocus({ table, enabled: true, injector })
      : undefined;
    const root = (): HTMLElement | null => this.root()?.nativeElement ?? null;
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
    }));
    this.view.set({
      table,
      selection,
      grid,
      columnMenu: table.featureOptions.enableColumnMenu === true,
      columnMenuProps,
      filters,
    });
  }
}
