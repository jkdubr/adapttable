import { createMemoryAdapter } from "@adapttable/core";
import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../columnDef";
import { injectDataTable } from "../dataTable";
import { groupingPanel } from "../features/groupingPanel";
import { injectFrontendData } from "../source/frontendData";
import { ADAPTTABLE_URL_ADAPTER } from "../url/tableUrlState";
import { injectGroupingPanelState } from "./groupingPanelState";

interface Person {
  id: string;
  team: string;
  budget: number;
}

const PEOPLE: Person[] = [
  { id: "1", team: "A", budget: 10 },
  { id: "2", team: "B", budget: 20 },
];

const COLUMNS: ColumnDef<Person>[] = [
  { key: "team", header: "Team" },
  { key: "budget", header: "Budget" },
];

@Component({
  template: `
    @if (panel(); as props) {
      <output class="keys">{{ props.state.groupBy.join(",") }}</output>
      <button type="button" class="add" (click)="props.state.add('budget')">
        add
      </button>
      <button type="button" class="remove" (click)="props.state.remove('team')">
        remove
      </button>
    }
  `,
})
class LiveHost {
  private readonly people = signal(PEOPLE);
  private readonly source = injectFrontendData<Person>({
    data: this.people,
    columns: COLUMNS,
    getRowId: (row) => row.id,
  });
  private readonly features = [groupingPanel(["team"])];
  private readonly table = injectDataTable<Person>({
    source: this.source,
    columns: COLUMNS,
    rowKey: (row) => row.id,
    features: this.features,
  });
  readonly panel = injectGroupingPanelState({
    table: this.table,
    source: this.source,
    features: this.features,
  })!;
}

@Component({ template: "" })
class EmptyHost {
  private readonly people = signal(PEOPLE);
  private readonly source = injectFrontendData<Person>({
    data: this.people,
    columns: COLUMNS,
    getRowId: (row) => row.id,
  });
  private readonly table = injectDataTable<Person>({
    source: this.source,
    columns: COLUMNS,
    rowKey: (row) => row.id,
  });
  readonly panel = injectGroupingPanelState({
    table: this.table,
    source: this.source,
    features: [],
  });
}

describe("injectGroupingPanelState", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ADAPTTABLE_URL_ADAPTER, useValue: createMemoryAdapter() },
      ],
    });
  });

  it("seeds groupBy and lets the strip add and remove fields", async () => {
    const fixture = TestBed.createComponent(LiveHost);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector(".keys")?.textContent).toBe("team");
    element.querySelector<HTMLButtonElement>(".add")?.click();
    await fixture.whenStable();
    expect(element.querySelector(".keys")?.textContent).toBe("team,budget");
    element.querySelector<HTMLButtonElement>(".remove")?.click();
    await fixture.whenStable();
    expect(element.querySelector(".keys")?.textContent).toBe("budget");
  });

  it("returns nothing without the panel feature", () => {
    const fixture = TestBed.createComponent(EmptyHost);
    expect(fixture.componentInstance.panel).toBeUndefined();
  });
});
