/**
 * The unstyled Angular table: semantic HTML with `data-adapttable-part`
 * hooks and no styles of its own, over `@adapttable/angular`. Native HTML is
 * this kit's kit, so every control a reader uses is the browser's own.
 */
import {
  AdaptAttrs,
  AdaptCell,
  AdaptCellTemplate,
  AdaptHeader,
  AdaptLiveRegion,
  type ColumnDef,
  type DataTable,
  type Direction,
  type ExtraFilters,
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
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  Injector,
  input,
  type OnInit,
  output,
  signal,
} from "@angular/core";

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
  imports: [AdaptAttrs, AdaptCell, AdaptHeader, AdaptLiveRegion],
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
  /** Every selection change, as the full list of selected ids. */
  readonly selectionChange = output<string[]>();

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

  private readonly injector = inject(Injector);

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
      injector,
    });
    const grid = this.cellNavigation()
      ? injectGridFocus({ table, enabled: true, injector })
      : undefined;
    this.view.set({ table, selection, grid });
  }
}
