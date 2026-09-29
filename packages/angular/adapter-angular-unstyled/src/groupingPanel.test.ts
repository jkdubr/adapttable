import type { ColumnDef } from "@adapttable/angular";
import { type GroupingPanelState, resolveLabels } from "@adapttable/core";
import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";

import { AdaptGroupingPanel } from "./groupingPanel";

interface Row {
  id: string;
}

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
    removeDropProps: () => ({}),
    add: () => undefined,
    remove: () => undefined,
    moveBy: () => undefined,
    setAggregate: () => undefined,
    drag: { key: "team", source: "chip" },
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
  template: `
    <adapt-grouping-panel
      [state]="panel()"
      [columns]="columns"
      [labels]="labels"
      [mobile]="false"
    />
  `,
})
class Host {
  readonly labels = resolveLabels(undefined);
  readonly columns = COLUMNS;
  readonly added: string[] = [];
  readonly removed: string[] = [];
  readonly panel = signal<GroupingPanelState>(
    state({
      add: (key) => {
        this.added.push(key);
      },
      remove: (key) => {
        this.removed.push(key);
      },
      addAggregate: (key) => {
        this.added.push(`agg:${key}`);
      },
    })
  );
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
});
