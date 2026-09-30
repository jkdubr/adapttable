/**
 * Kit editable cell: focus, select options, and parsed value types.
 */
import {
  type AdaptTableFeature,
  type CellEditHandler,
  type ColumnDef,
} from "@adapttable/angular";
import { editing } from "@adapttable/angular-unstyled/editing";
import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdaptDataTable } from "../dataTable";

interface Shift {
  id: string;
  name: string;
  approved: boolean;
  day: string;
  age: number;
  team: string;
}

const ROW: Shift = {
  id: "1",
  name: "Ada",
  approved: false,
  day: "2026-08-13",
  age: 36,
  team: "web",
};

const COLUMNS: ColumnDef<Shift>[] = [
  { key: "name", accessor: (row) => row.name, editable: true },
  {
    key: "approved",
    accessor: (row) => row.approved,
    editable: true,
    editor: "boolean",
  },
  {
    key: "day",
    accessor: (row) => row.day,
    editable: true,
    editor: "date",
  },
  {
    key: "age",
    accessor: (row) => row.age,
    editable: true,
    editor: "number",
  },
  {
    key: "team",
    accessor: (row) => row.team,
    editable: true,
    editor: {
      type: "select",
      options: [
        { value: "core", label: "Core" },
        { value: "web", label: "Web" },
      ],
    },
  },
];

@Component({
  imports: [AdaptDataTable],
  template: `
    <adapt-data-table
      [data]="[row]"
      [columns]="columns"
      [rowKey]="rowKey"
      [features]="features()"
      [urlSync]="false"
    />
  `,
})
class Host {
  readonly row = ROW;
  readonly columns = COLUMNS;
  readonly rowKey = (row: Shift) => row.id;
  readonly features = input<readonly AdaptTableFeature[]>([]);
}

function part(name: string): HTMLElement | null {
  return document.querySelector(`[data-adapttable-part="${name}"]`);
}

function activates(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>(
      '[data-adapttable-part="edit-cell-activate"]'
    ),
  ];
}

function editor(): HTMLElement | null {
  return part("edit-cell-editor");
}

async function mount(onCellEdit: CellEditHandler<Shift>) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentRef.setInput("features", [editing(onCellEdit)]);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  document.body.append(fixture.nativeElement as HTMLElement);
  return {
    fixture,
    settle: async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    },
  };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("AdaptEditableCell", () => {
  it("focuses the editor on open and returns focus to activate on Escape", async () => {
    const onCellEdit = vi.fn();
    const { settle } = await mount(onCellEdit as CellEditHandler<Shift>);
    const activate = activates()[0]!;
    activate.focus();
    expect(document.activeElement).toBe(activate);
    activate.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await settle();
    const input = editor();
    expect(input).not.toBeNull();
    expect(document.activeElement).toBe(input);
    input!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    await settle();
    expect(editor()).toBeNull();
    expect(document.activeElement).toBe(activates()[0]);
  });

  it("keeps arrow keys on the editor so caret moves without grid focus", async () => {
    const onCellEdit = vi.fn();
    const { settle } = await mount(onCellEdit as CellEditHandler<Shift>);
    activates()[0]!.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true })
    );
    await settle();
    const input = editor() as HTMLInputElement;
    expect(input).not.toBeNull();
    input.focus();
    input.setSelectionRange(1, 1);
    const arrow = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
      cancelable: true,
    });
    const stopped = vi.spyOn(arrow, "stopPropagation");
    input.dispatchEvent(arrow);
    expect(stopped).toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it("offers only the select column's options", async () => {
    const onCellEdit = vi.fn();
    const { settle } = await mount(onCellEdit as CellEditHandler<Shift>);
    activates()[4]!.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true })
    );
    await settle();
    const select = editor() as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    const texts = [...select.options].map((option) => option.text);
    expect(texts).toEqual(["Core", "Web"]);
    // The row's value, not the first option offered.
    expect(select.value).toBe("web");
    expect(select.selectedOptions[0]?.text).toBe("Web");
  });

  it("hands the host a number for a number editor", async () => {
    const onCellEdit = vi.fn();
    const { settle } = await mount(onCellEdit as CellEditHandler<Shift>);
    activates()[3]!.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true })
    );
    await settle();
    const input = editor() as HTMLInputElement;
    expect(input.type).toBe("number");
    input.value = "42";
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    await settle();
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(ROW, "age", 42);
  });

  it("hands the host a boolean for a checkbox editor", async () => {
    const onCellEdit = vi.fn();
    const { settle } = await mount(onCellEdit as CellEditHandler<Shift>);
    activates()[1]!.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true })
    );
    await settle();
    const box = editor() as HTMLInputElement;
    expect(box.type).toBe("checkbox");
    box.click();
    await settle();
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(ROW, "approved", true);
  });

  it("hands the host the date string for a date editor", async () => {
    const onCellEdit = vi.fn();
    const { settle } = await mount(onCellEdit as CellEditHandler<Shift>);
    activates()[2]!.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true })
    );
    await settle();
    const input = editor() as HTMLInputElement;
    expect(input.type).toBe("date");
    expect(input.value).toBe("2026-08-13");
    input.value = "2026-09-01";
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    await settle();
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROW,
      "day",
      "2026-09-01"
    );
  });
});
