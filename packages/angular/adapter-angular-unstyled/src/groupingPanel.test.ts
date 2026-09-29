import {
  type ColumnDef,
  type GroupingPanelSlotProps,
} from "@adapttable/angular";
import { groupingPanel } from "@adapttable/angular-unstyled/grouping-panel";
import { type GroupingPanelState, resolveLabels } from "@adapttable/core";
import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";

import { AdaptGroupingPanel } from "./components/groupingPanel";
import { AdaptDataTable } from "./dataTable";

interface Row {
  id: string;
  team: string;
  budget: number;
}

const ROWS: Row[] = [
  { id: "1", team: "A", budget: 10 },
  { id: "2", team: "B", budget: 20 },
];

const COLUMNS: ColumnDef<Row>[] = [
  { key: "team", header: "Team" },
  { key: "budget", header: "Budget" },
];

function state(
  overrides: Partial<GroupingPanelState> = {}
): GroupingPanelState {
  return {
    groupBy: ["team"],
    aggregateOverrides: {},
    canSetAggregates: true,
    announcement: "Grouped by Team",
    headerDragProps: () => ({}),
    chipDragProps: () => ({ draggable: true }),
    chipKeyboardProps: (_key, label) => ({
      tabIndex: 0,
      role: "button",
      "aria-label": `Move ${label}`,
      onKeyDown: () => undefined,
    }),
    dropProps: () => ({}),
    removeDropProps: () => ({
      onDragEnter: () => undefined,
      onDragOver: () => undefined,
      onDragLeave: () => undefined,
      onDrop: () => undefined,
    }),
    add: () => undefined,
    remove: () => undefined,
    moveBy: () => undefined,
    setAggregate: () => undefined,
    aggregations: {
      items: [
        {
          columnKey: "budget",
          operationId: "sum",
          editable: true,
          origin: "reader",
          operations: [{ id: "sum", builtIn: true }],
        },
      ],
      candidates: [
        { columnKey: "budget", active: false, operations: [] },
        { columnKey: "team", active: true, operations: [] },
      ],
      atDefaults: false,
      hasDefaults: true,
    },
    setAggregateOperation: () => undefined,
    addAggregate: () => undefined,
    removeAggregate: () => undefined,
    restoreAggregateDefaults: () => undefined,
    ...overrides,
  };
}

@Component({
  imports: [AdaptGroupingPanel],
  template: `<adapt-grouping-panel [props]="panel()" />`,
})
class Host {
  readonly added: string[] = [];
  readonly removed: string[] = [];
  readonly panel = signal<GroupingPanelSlotProps<ColumnDef<Row>>>({
    state: state({
      add: (key) => {
        this.added.push(key);
      },
      remove: (key) => {
        this.removed.push(key);
      },
      addAggregate: (key) => {
        this.added.push(`agg:${key}`);
      },
      drag: { key: "team", source: "chip", overRemove: true },
    }),
    columns: COLUMNS,
    labels: resolveLabels(undefined),
    mobile: false,
  });
}

@Component({
  imports: [AdaptDataTable],
  template: `
    <adapt-data-table
      [data]="data"
      [columns]="columns"
      [rowKey]="rowKey"
      [urlSync]="false"
      [features]="features"
    />
  `,
})
class TableHost {
  readonly data = ROWS;
  readonly columns = COLUMNS;
  readonly rowKey = (row: Row) => row.id;
  readonly features = [groupingPanel(["team"]), groupingPanel()];
}

describe("AdaptGroupingPanel", () => {
  it("draws the strip with native controls", async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;
    const add = element.querySelector<HTMLSelectElement>(
      '[data-adapttable-part="grouping-add"]'
    );
    expect(add?.getAttribute("aria-label")).toBe("Add grouping column");
    if (!add) return;
    add.value = "";
    add.dispatchEvent(new Event("change"));
    add.value = "budget";
    add.dispatchEvent(new Event("change"));
    element
      .querySelector<HTMLButtonElement>(
        '[data-adapttable-part="grouping-chip-remove"]'
      )
      ?.click();
    const handle = element.querySelector<HTMLButtonElement>(
      '[data-adapttable-part="grouping-chip-handle"]'
    );
    handle?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    handle?.dispatchEvent(new Event("dragstart"));
    const zone = element.querySelector(
      '[data-adapttable-part="grouping-remove-zone"]'
    );
    zone?.dispatchEvent(new Event("dragenter"));
    zone?.dispatchEvent(new Event("dragover"));
    zone?.dispatchEvent(new Event("dragleave"));
    zone?.dispatchEvent(new Event("drop"));
    const picker = element.querySelector<HTMLSelectElement>(
      '[data-adapttable-part="grouping-aggregation-add"]'
    );
    if (picker) {
      picker.value = "";
      picker.dispatchEvent(new Event("change"));
      picker.value = "budget";
      picker.dispatchEvent(new Event("change"));
    }
    await fixture.whenStable();
    expect(host.added).toContain("budget");
    expect(host.removed).toEqual(["team"]);
    expect(
      element.querySelector('[data-adapttable-part="grouping-announcer"]')
        ?.textContent
    ).toBe("Grouped by Team");
  });

  it("composes the groupingPanel feature on the table", async () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector('[data-adapttable-part="grouping-panel"]')
    ).not.toBeNull();
  });
});
