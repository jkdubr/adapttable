import { createMemoryAdapter } from "@adapttable/core";
import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "./columnDef";
import { injectDataTable } from "./dataTable";
import { featureOptionsOf } from "./features";
import { injectFrontendData } from "./frontendData";
import { injectRowReorder, rowReorder } from "./rowReorder";
import { ADAPTTABLE_URL_ADAPTER } from "./url";

interface Person {
  id: string;
  name: string;
}

const PEOPLE: Person[] = [
  { id: "1", name: "Ada" },
  { id: "2", name: "Grace" },
  { id: "3", name: "Linus" },
];

const COLUMNS: ColumnDef<Person>[] = [
  { key: "name", accessor: (row) => row.name },
];

@Component({
  template: `
    <output class="lifted">{{ reorder()?.lifted?.rowId ?? "none" }}</output>
  `,
})
class ReorderHost {
  readonly data = signal(PEOPLE);
  readonly onRowReorder = vi.fn();
  readonly features = [rowReorder(this.onRowReorder)];
  readonly source = injectFrontendData({
    data: this.data,
    columns: COLUMNS,
    paginationMode: "paged",
    defaults: { limit: 10 },
  });
  readonly table = injectDataTable({
    source: this.source,
    columns: COLUMNS,
    rowKey: (row) => row.id,
  });
  readonly reorder = injectRowReorder({
    table: this.table,
    source: this.source,
    features: this.features,
  });
}

describe("rowReorder feature", () => {
  it("registers under the row-reorder id with the host handler", () => {
    const onRowReorder = vi.fn();
    const feature = rowReorder(onRowReorder);
    expect(feature.id).toBe("row-reorder");
    expect(featureOptionsOf([feature])).toEqual({});
  });
});

describe("injectRowReorder", () => {
  it("publishes drag, drop and keyboard handlers when composed", async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ADAPTTABLE_URL_ADAPTER, useValue: createMemoryAdapter() },
      ],
    });
    const fixture = TestBed.createComponent(ReorderHost);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const live = fixture.componentInstance.reorder!;
    const state = live();
    expect(state.lifted).toBeNull();
    expect(state.isLifted("1")).toBe(false);
    expect(state.isMovePending?.(PEOPLE[0]!)).toBe(false);
    expect(state.dragProps("1", 0).draggable).toBe(true);

    const drag = Object.assign(new Event("dragstart"), {
      dataTransfer: { setData: vi.fn(), effectAllowed: "move" },
    }) as unknown as DragEvent;
    state.dragProps("1", 0).onDragStart(drag);
    fixture.detectChanges();
    expect(live().isLifted("1")).toBe(true);
    expect(live().lifted?.rowId).toBe("1");

    const over = Object.assign(new Event("dragover"), {
      dataTransfer: { dropEffect: "move" },
      preventDefault: vi.fn(),
    }) as unknown as DragEvent;
    state.dropProps(1, PEOPLE[1]!, 0).onDragOver(over);
    const drop = Object.assign(new Event("drop"), {
      dataTransfer: {
        getData: () => "1:0",
        types: ["application/x-adapttable-row"],
      },
      preventDefault: vi.fn(),
    }) as unknown as DragEvent;
    state.dropProps(1, PEOPLE[1]!, 0).onDrop(drop);
    state.dragProps("1", 0).onDragEnd();
    fixture.detectChanges();

    state.handleKeyDown(
      new KeyboardEvent("keydown", { key: " " }),
      "2",
      1,
      PEOPLE[1]!,
      0,
      3
    );
    fixture.detectChanges();

    live().moveBy(0, 1, PEOPLE[0]!, 0, 3);
    live().moveMenu(PEOPLE[0]!);
    live().cancelMove();
    live().confirmMove();
    fixture.detectChanges();

    expect(live().rowAttrs("1", 0)).toEqual({
      "data-dragging": undefined,
      "data-drop": undefined,
    });
    expect(
      fixture.nativeElement.querySelector(".lifted")?.textContent?.trim()
    ).toBe("none");

    expect(
      TestBed.runInInjectionContext(() =>
        injectRowReorder({
          table: fixture.componentInstance.table,
          source: fixture.componentInstance.source,
          features: [],
        })
      )
    ).toBeUndefined();
  });
});
