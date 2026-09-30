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
import type { AdaptTableFeature } from "@adapttable/angular";
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
import { Component, computed, signal, type Type } from "@angular/core";

import {
  applyPersonEdit,
  FILTER_DEFS,
  makeLargeDirectory,
  PEOPLE,
  peopleColumns,
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

/** Scale: forty thousand rows, windowed, in a scroll box. */
@Component({
  selector: "adapt-showcase-scale",
  imports: [AdaptDataTable],
  template: `
    <div class="mx-demo">
      <div class="hint-row">
        <span class="hint"
          >{{ count }} rows — only the ones in view render</span
        >
      </div>
      <div class="mx-demo__body">
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
      </div>
    </div>
  `,
})
class ScaleBody {
  readonly count = SCALE_ROWS;
  readonly rows = makeLargeDirectory(SCALE_ROWS);
  readonly columns = COLUMNS;
  readonly rowKey = rowKey;
  readonly features: readonly AdaptTableFeature[] = [virtualize()];
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
