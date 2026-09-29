/**
 * Keyboard reorder stays on the loaded page — rowCount is on-screen rows,
 * not the source total.
 */
import { type ColumnDef, type PaginationMode } from "@adapttable/angular";
import { rowReorder } from "@adapttable/angular-unstyled/row-reorder";
import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdaptDataTable } from "../src/dataTable";

interface Task {
  id: string;
  title: string;
}

const ROWS: Task[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  title: `Task ${String(i + 1).padStart(2, "0")}`,
}));

const COLUMNS: ColumnDef<Task>[] = [
  { key: "title", accessor: (row) => row.title },
];

@Component({
  imports: [AdaptDataTable],
  template: `
    <adapt-data-table
      [data]="data"
      [columns]="columns"
      [rowKey]="rowKey"
      [urlSync]="false"
      [defaults]="{ limit: 10 }"
      [features]="features"
      [paginationMode]="paginationMode()"
    />
  `,
})
class ReorderHost {
  readonly data = ROWS;
  readonly columns = COLUMNS;
  readonly rowKey = (row: Task) => row.id;
  readonly onRowReorder = vi.fn();
  readonly features = [rowReorder(this.onRowReorder)];
  readonly paginationMode = input<PaginationMode>("paged");
}

async function mount(mode: PaginationMode) {
  const fixture = TestBed.createComponent(ReorderHost);
  fixture.componentRef.setInput("paginationMode", mode);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  return {
    fixture,
    element,
    onRowReorder: fixture.componentInstance.onRowReorder,
    settle: () => fixture.whenStable(),
  };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("row reorder keyboard page clamp", () => {
  it("clamps ArrowDown to the paged page, not the source total", async () => {
    const { element, onRowReorder, settle } = await mount("paged");
    const grips = [
      ...element.querySelectorAll<HTMLElement>(
        '[data-adapttable-part="reorder-handle"]'
      ),
    ];
    expect(grips).toHaveLength(10);
    const grip = grips[0];
    expect(grip).toBeTruthy();

    grip!.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true })
    );
    await settle();
    for (let i = 0; i < 15; i += 1) {
      grip!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
      );
    }
    grip!.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true })
    );
    await settle();

    expect(onRowReorder).toHaveBeenCalledExactlyOnceWith(0, 9, ROWS[0]);
  });

  it("clamps ArrowDown to the loaded infinite window, not the source total", async () => {
    const { element, onRowReorder, settle } = await mount("infinite");
    const grips = [
      ...element.querySelectorAll<HTMLElement>(
        '[data-adapttable-part="reorder-handle"]'
      ),
    ];
    expect(grips.length).toBeGreaterThanOrEqual(10);
    expect(grips.length).toBeLessThan(50);
    const grip = grips[0];
    expect(grip).toBeTruthy();
    const loadedCount = grips.length;

    grip!.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true })
    );
    await settle();
    for (let i = 0; i < loadedCount + 5; i += 1) {
      grip!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
      );
    }
    grip!.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true })
    );
    await settle();

    expect(onRowReorder).toHaveBeenCalledExactlyOnceWith(
      0,
      loadedCount - 1,
      ROWS[0]
    );
  });
});
