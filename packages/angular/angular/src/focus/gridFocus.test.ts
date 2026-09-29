/**
 * The keyboard grid reports the selected rectangle to the host.
 */
import { createMemoryAdapter } from "@adapttable/core";
import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdaptAttrs } from "../attrs";
import type { ColumnDef } from "../columnDef";
import { injectDataTable } from "../dataTable";
import type { AdaptTableFeature } from "../featureHost";
import { cellNavigation } from "../features/cellNavigation";
import { injectFrontendData } from "../source/frontendData";
import { ADAPTTABLE_URL_ADAPTER } from "../url/tableUrlState";
import { injectGridFocus } from "./gridFocus";

interface Pair {
  id: string;
  a: string;
  b: string;
}

const ROWS: Pair[] = [
  { id: "1", a: "a1", b: "b1" },
  { id: "2", a: "a2", b: "b2" },
];

const COLUMNS: ColumnDef<Pair>[] = [
  { key: "a", header: "A" },
  { key: "b", header: "B" },
];

let features: readonly AdaptTableFeature[] = [];
let explicit: ((range: unknown) => void) | undefined;

@Component({
  imports: [AdaptAttrs],
  template: `
    <table [adaptAttrs]="grid.tableAttrs()">
      <tbody>
        @for (row of table.rows(); track row.id; let r = $index) {
          <tr [adaptAttrs]="grid.rowAttrs(row, r)">
            @for (column of table.columns(); track column.key; let c = $index) {
              <td [adaptAttrs]="grid.cellAttrs(column, r, c)">
                {{ column.key }}{{ row.id }}
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
})
class Host {
  private readonly source = injectFrontendData<Pair>({
    data: signal(ROWS),
    columns: COLUMNS,
    getRowId: (row) => row.id,
  });
  readonly table = injectDataTable<Pair>({
    source: this.source,
    columns: COLUMNS,
    rowKey: (row) => row.id,
    features,
  });
  readonly grid = injectGridFocus({
    table: this.table,
    enabled: true,
    onRangeChange: explicit,
  });
}

async function mount() {
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  return () => fixture.whenStable();
}

async function selectDown(settle: () => Promise<unknown>) {
  document.querySelector<HTMLElement>("td")!.focus();
  await settle();
  (document.activeElement as HTMLElement).dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "ArrowDown",
      shiftKey: true,
      bubbles: true,
    })
  );
  await settle();
}

beforeEach(() => {
  features = [];
  explicit = undefined;
  TestBed.configureTestingModule({
    providers: [
      { provide: ADAPTTABLE_URL_ADAPTER, useValue: createMemoryAdapter() },
    ],
  });
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("injectGridFocus range reporting", () => {
  it("reports through the onRangeChange it is handed", async () => {
    const onRangeChange = vi.fn();
    explicit = onRangeChange;
    const settle = await mount();
    await selectDown(settle);
    expect(onRangeChange).toHaveBeenLastCalledWith({
      anchor: { row: 0, col: 0 },
      head: { row: 1, col: 0 },
    });
  });

  it("reports through a composed cellNavigation({ onRangeChange })", async () => {
    const onRangeChange = vi.fn();
    features = [cellNavigation({ onRangeChange })];
    const settle = await mount();
    expect(onRangeChange).toHaveBeenCalledExactlyOnceWith(null);
    await selectDown(settle);
    expect(onRangeChange).toHaveBeenLastCalledWith({
      anchor: { row: 0, col: 0 },
      head: { row: 1, col: 0 },
    });
  });
});
