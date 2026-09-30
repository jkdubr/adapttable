/**
 * The demo each Angular feature page mounts under its seam, one component
 * per feature, and the table the kit's landing page shows.
 *
 * Every body is the real `@adapttable/angular-unstyled` table with that
 * feature composed, over the same people the React pages show. Where the
 * table asks the host to write — an edit, a move, a bulk action — the body
 * writes and says what it did on the line under the table, so what the host
 * received is on the page.
 */
import {
  type AdaptTableFeature,
  injectQuerySource,
  injectServerData,
} from "@adapttable/angular";
import { AdaptDataTable } from "@adapttable/angular-unstyled";
import { bulkActions } from "@adapttable/angular-unstyled/bulk-actions";
import { cellNavigation } from "@adapttable/angular-unstyled/cell-navigation";
import { editing } from "@adapttable/angular-unstyled/editing";
import { exportCsv } from "@adapttable/angular-unstyled/export";
import { filters } from "@adapttable/angular-unstyled/filters";
import { groupingPanel } from "@adapttable/angular-unstyled/grouping-panel";
import { headerFilters } from "@adapttable/angular-unstyled/header-filters";
import { rowReorder } from "@adapttable/angular-unstyled/row-reorder";
import { savedViews } from "@adapttable/angular-unstyled/saved-views";
import { virtualize } from "@adapttable/angular-unstyled/virtualize";
import { applyRowReorder } from "@adapttable/core";
import {
  Component,
  computed,
  type Signal,
  signal,
  type Type,
} from "@angular/core";
import {
  injectInfiniteQuery,
  provideTanStackQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";

import {
  applyPersonEdit,
  fetchPeople,
  FILTER_DEFS,
  largePerson,
  makeLargeDirectory,
  PEOPLE,
  peopleColumns,
  type PeoplePage,
  type PeopleParams,
  peopleRows,
  type Person,
  rowKey,
} from "./data";

/** The people columns, shared by every page that does not edit them. */
const COLUMNS = peopleColumns();

/** The three ways the filtering page lays its filters out. */
type FilterLayout = "popover" | "drawer" | "header";

/** Filters: popover, drawer or header funnels, chips, and URL state. */
@Component({
  selector: "adapt-showcase-filtering",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="hint-row">
        <span class="hint">Filters opens the popover or the drawer</span>
        <span class="hint">Advanced sits at the top of that panel</span>
        <span class="hint">Header funnels filter one column</span>
        <div class="seg" role="group" aria-label="Filter layout">
          @for (option of layouts; track option.value) {
            <button
              type="button"
              class="seg__btn"
              [class.is-on]="layout() === option.value"
              [attr.aria-pressed]="layout() === option.value"
              (click)="layout.set(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      </div>
      <div class="mx-demo__body">
        @for (current of mounted(); track current) {
          <adapt-data-table
            tableLabel="People"
            urlKey="flt"
            [data]="rows"
            [columns]="columns"
            [rowKey]="rowKey"
            [filtersMode]="current === 'drawer' ? 'drawer' : 'popover'"
            [features]="featuresFor(current)"
          />
        }
      </div>
    </div>
  `,
})
class FilteringBody {
  readonly rows = PEOPLE;
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly layouts: readonly { value: FilterLayout; label: string }[] = [
    { value: "popover", label: "Popover" },
    { value: "drawer", label: "Drawer" },
    { value: "header", label: "Header" },
  ];
  readonly layout = signal<FilterLayout>("popover");
  /**
   * The layout the table is mounted for — one entry, replaced when the layout
   * changes, so switching remounts the table the way React's `key` does.
   */
  readonly mounted = computed(() => [this.layout()]);
  private readonly panel: readonly AdaptTableFeature[] = [filters(FILTER_DEFS)];
  private readonly header: readonly AdaptTableFeature[] = [
    filters(FILTER_DEFS),
    headerFilters(),
  ];

  /** The header layout adds the funnels; the others keep the panel's fields. */
  featuresFor(layout: FilterLayout): readonly AdaptTableFeature[] {
    return layout === "header" ? this.header : this.panel;
  }
}

/** Selection: row and page checkboxes, and bulk actions over the set. */
@Component({
  selector: "adapt-showcase-selection",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="mx-demo__body">
        <adapt-data-table
          tableLabel="People"
          [urlSync]="false"
          [data]="rows"
          [columns]="columns"
          [rowKey]="rowKey"
          [selectable]="true"
          [defaults]="{ limit: 10 }"
          [features]="features"
        />
      </div>
      <p class="hint" role="status" data-demo-log>{{ log() }}</p>
    </div>
  `,
})
class SelectionBody {
  readonly rows = PEOPLE;
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly log = signal("Select rows, then run a bulk action.");
  readonly features: readonly AdaptTableFeature[] = [
    bulkActions([
      {
        key: "export",
        label: "Export",
        onClick: (ids) => this.log.set(`Export: ${ids.join(", ")}`),
      },
      {
        key: "archive",
        label: "Archive",
        onClick: (ids) => this.log.set(`Archive: ${ids.join(", ")}`),
      },
    ]),
  ];
}

/** Row reordering: a grip, keyboard moves, and the host writing each move. */
@Component({
  selector: "adapt-showcase-row-reordering",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="hint-row">
        <span class="hint"
          >Space lifts a row, arrows move it, Space drops it</span
        >
      </div>
      <div class="mx-demo__body">
        <adapt-data-table
          tableLabel="People"
          [urlSync]="false"
          [data]="rows()"
          [columns]="columns"
          [rowKey]="rowKey"
          [defaults]="{ limit: 10 }"
          [features]="features"
        />
      </div>
      <p class="hint" role="status" data-demo-log>{{ log() }}</p>
    </div>
  `,
})
class RowReorderingBody {
  readonly rows = signal<readonly Person[]>(peopleRows());
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly log = signal("Drag a grip, or lift a row with Space.");
  readonly features: readonly AdaptTableFeature[] = [
    rowReorder<Person>((from, to, row) => {
      this.rows.update((rows) => applyRowReorder(rows, from, to));
      this.log.set(
        `Moved ${row.name} from ${String(from + 1)} to ${String(to + 1)}`
      );
    }),
  ];
}

/** Editing: kit-native editors in the cell; the host writes every change. */
@Component({
  selector: "adapt-showcase-editing",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="hint-row">
        <span class="hint">Double-click a cell to edit it</span>
        <span class="hint">Enter commits, Escape cancels</span>
      </div>
      <div class="mx-demo__body">
        <adapt-data-table
          tableLabel="People"
          [urlSync]="false"
          [data]="rows()"
          [columns]="columns"
          [rowKey]="rowKey"
          [defaults]="{ limit: 10 }"
          [features]="features"
        />
      </div>
      <p class="hint" role="status" data-demo-log>{{ log() }}</p>
    </div>
  `,
})
class EditingBody {
  readonly rows = signal<readonly Person[]>(peopleRows());
  readonly columns = peopleColumns({ editable: true });
  readonly rowKey = rowKey;
  readonly log = signal("Every change goes through the host.");
  readonly features: readonly AdaptTableFeature[] = [
    editing<Person>((row, key, value) => {
      this.rows.update((rows) => applyPersonEdit(rows, row, key, value));
      this.log.set(`Saved ${key} for ${row.name}: ${String(value)}`);
    }),
    cellNavigation(),
  ];
}

/** Grouping: the panel, nested groups, and aggregates in the headers. */
@Component({
  selector: "adapt-showcase-grouping",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="mx-demo__body">
        <adapt-data-table
          tableLabel="People"
          urlKey="grp"
          [data]="rows"
          [columns]="columns"
          [rowKey]="rowKey"
          [features]="features"
        />
      </div>
    </div>
  `,
})
class GroupingBody {
  readonly rows = PEOPLE;
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly features: readonly AdaptTableFeature[] = [
    groupingPanel(["team", "status"]),
  ];
}

/** Export: a CSV of the current view from the toolbar. */
@Component({
  selector: "adapt-showcase-export",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="mx-demo__body">
        <adapt-data-table
          tableLabel="People"
          [urlSync]="false"
          [data]="rows"
          [columns]="columns"
          [rowKey]="rowKey"
          [features]="features"
        />
      </div>
    </div>
  `,
})
class ExportBody {
  readonly rows = PEOPLE;
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly features: readonly AdaptTableFeature[] = [exportCsv()];
}

/** How many rows the scale page windows. */
const SCALE_ROWS = 40_000;

/** Where the scale page's rows come from: `?tier=server` or `?tier=query`. */
type ScaleTier = "frontend" | "server" | "query";

/** The tier the page's URL asks for. */
function scaleTier(): ScaleTier {
  const tier = new URLSearchParams(location.search).get("tier");
  return tier === "server" || tier === "query" ? tier : "frontend";
}

/** The frontend tier: every row in memory, windowed. */
@Component({
  selector: "adapt-showcase-scale-frontend",
  imports: [AdaptDataTable],
  template: `
    <adapt-data-table
      tableLabel="People"
      [urlSync]="false"
      paginationMode="infinite"
      [maxHeight]="480"
      [data]="rows"
      [columns]="columns"
      [rowKey]="rowKey"
      [defaults]="{ limit: count }"
      [features]="features"
    />
  `,
})
class ScaleFrontendTable {
  readonly count = SCALE_ROWS;
  readonly rows = makeLargeDirectory(SCALE_ROWS);
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly features: readonly AdaptTableFeature[] = [virtualize()];
}

/**
 * The server tier: the table asks for a slice and this answers it, deriving
 * each row from its index, so the browser never holds the set and the total
 * the pager reports is the real one.
 */
@Component({
  selector: "adapt-showcase-scale-server",
  imports: [AdaptDataTable],
  template: `
    <adapt-data-table
      tableLabel="People"
      [urlSync]="false"
      [maxHeight]="480"
      [source]="source"
      [columns]="columns"
      [rowKey]="rowKey"
      [features]="features"
    />
  `,
})
class ScaleServerTable {
  private readonly slice = signal({ from: 0, limit: 500 });
  readonly source = injectServerData<Person>({
    rows: computed(() => {
      const { from, limit } = this.slice();
      return Array.from(
        { length: Math.max(0, Math.min(limit, SCALE_ROWS - from)) },
        (_, index) => largePerson(from + index)
      );
    }),
    total: SCALE_ROWS,
    urlSync: false,
    paginationMode: "infinite",
    defaults: { limit: 500 },
    onQueryChange: (query) => {
      this.slice.set({
        from: (query.page - 1) * query.limit,
        limit: query.limit,
      });
    },
  });
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly features: readonly AdaptTableFeature[] = [
    virtualize({ estimateRowSize: 48 }),
  ];
}

/** The people endpoint as an infinite query, keyed on the table's params. */
function injectPeopleQuery(params: Signal<Partial<PeopleParams>>) {
  return injectInfiniteQuery(() => {
    const current = params();
    return {
      queryKey: ["people", current],
      queryFn: ({ pageParam }: { pageParam: number }) =>
        fetchPeople({ ...current, page: pageParam }),
      initialPageParam: current.page ?? 1,
      getNextPageParam: (last: PeoplePage) => last.nextPage ?? undefined,
    };
  });
}

/**
 * The query-library tier: the table's view becomes the params of an Angular
 * Query infinite query over the people endpoint, and its pages the rows.
 */
@Component({
  selector: "adapt-showcase-scale-query",
  imports: [AdaptDataTable],
  providers: [provideTanStackQuery(new QueryClient())],
  template: `
    <adapt-data-table
      tableLabel="People"
      [urlSync]="false"
      [source]="source"
      [columns]="columns"
      [rowKey]="rowKey"
    />
  `,
})
class ScaleQueryTable {
  readonly source = injectQuerySource<Person, PeopleParams, PeoplePage>({
    query: injectPeopleQuery,
    urlSync: false,
    paginationMode: "paged",
    defaults: { limit: 10 },
    selectPage: (page) => ({
      rows: page.items,
      total: page.total,
      facets: page.facets,
    }),
  });
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
}

/** Scale: forty thousand rows, windowed, in a scroll box — or served. */
@Component({
  selector: "adapt-showcase-scale",
  imports: [ScaleFrontendTable, ScaleServerTable, ScaleQueryTable],
  template: `
    <div class="mx-demo">
      <div class="hint-row">
        <span class="hint">{{ hint }}</span>
      </div>
      <div class="mx-demo__body">
        @switch (tier) {
          @case ("server") {
            <adapt-showcase-scale-server />
          }
          @case ("query") {
            <adapt-showcase-scale-query />
          }
          @default {
            <adapt-showcase-scale-frontend />
          }
        }
      </div>
    </div>
  `,
})
class ScaleBody {
  readonly tier = scaleTier();
  readonly hint = {
    frontend: `${SCALE_ROWS} rows — only the ones in view render`,
    server: `${SCALE_ROWS} rows on the server — each slice fetched as you scroll`,
    query: "Every page comes from an Angular Query infinite query",
  }[this.tier];
}

/** Mobile cards: the same table, every row a card, in a phone-width frame. */
@Component({
  selector: "adapt-showcase-mobile-cards",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="mx-demo__body mx-phone">
        <adapt-data-table
          tableLabel="People"
          [urlSync]="false"
          [forceMobile]="true"
          [data]="rows"
          [columns]="columns"
          [rowKey]="rowKey"
          [defaults]="{ limit: 8 }"
        />
      </div>
    </div>
  `,
})
class MobileCardsBody {
  readonly rows = PEOPLE;
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
}

/** Saved views: name the table's state and pick it again from the menu. */
@Component({
  selector: "adapt-showcase-saved-views",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="hint-row">
        <span class="hint"
          >Sort or filter, then save the view under a name</span
        >
      </div>
      <div class="mx-demo__body">
        <adapt-data-table
          tableLabel="People"
          urlKey="views"
          [urlSync]="false"
          [data]="rows"
          [columns]="columns"
          [rowKey]="rowKey"
          [features]="features"
        />
      </div>
    </div>
  `,
})
class SavedViewsBody {
  readonly rows = PEOPLE;
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly features: readonly AdaptTableFeature[] = [
    filters(FILTER_DEFS),
    savedViews({
      storageKey: "adapttable-angular-demo-views",
      urlKey: "views",
    }),
  ];
}

/** The landing page's table: filters, sorting and paging, nothing to explain. */
@Component({
  selector: "adapt-showcase-landing-table",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="mx-demo__body">
        <adapt-data-table
          tableLabel="People"
          [urlSync]="false"
          [data]="rows"
          [columns]="columns"
          [rowKey]="rowKey"
          [defaults]="{ limit: 10 }"
          [features]="features"
        />
      </div>
    </div>
  `,
})
export class AdaptShowcaseLandingTable {
  readonly rows = PEOPLE;
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly features: readonly AdaptTableFeature[] = [filters(FILTER_DEFS)];
}

/** Feature slug to the demo that page shows. */
export const FEATURE_BODIES: Readonly<Record<string, Type<unknown>>> = {
  filtering: FilteringBody,
  selection: SelectionBody,
  "row-reordering": RowReorderingBody,
  editing: EditingBody,
  grouping: GroupingBody,
  export: ExportBody,
  scale: ScaleBody,
  "mobile-cards": MobileCardsBody,
  "saved-views": SavedViewsBody,
};
