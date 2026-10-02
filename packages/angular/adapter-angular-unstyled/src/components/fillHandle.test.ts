/** Native fill handles and clipboard gestures through the complete table. */
import type { AdaptTableFeature, ColumnDef } from "@adapttable/angular";
import { cellNavigation } from "@adapttable/angular-unstyled/cell-navigation";
import {
  editHistory,
  editing,
  undoRedoButtons,
} from "@adapttable/angular-unstyled/editing";
import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdaptDataTable } from "../dataTable";

interface Row {
  id: string;
  name: string;
}

@Component({
  imports: [AdaptDataTable],
  template: `<adapt-data-table
    [data]="data"
    [columns]="columns"
    [rowKey]="rowKey"
    [features]="features()"
    [forceMobile]="mobile()"
    [urlSync]="false"
    dir="rtl"
  />`,
})
class Host {
  readonly data: Row[] = [
    { id: "1", name: "First" },
    { id: "2", name: "Second" },
  ];
  readonly columns: ColumnDef<Row>[] = [{ key: "name", editable: true }];
  readonly rowKey = (row: Row) => row.id;
  readonly features = input<readonly AdaptTableFeature[]>([]);
  readonly mobile = input(false);
}

const part = <T extends HTMLElement>(name: string) =>
  document.querySelector<T>(`[data-adapttable-part="${name}"]`);
const cells = () => [
  ...document.querySelectorAll<HTMLElement>('[data-adapttable-part="cell"]'),
];

async function mount(features: readonly AdaptTableFeature[], mobile = false) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentRef.setInput("features", features);
  fixture.componentRef.setInput("mobile", mobile);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  return fixture;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("unstyled range editing", () => {
  it("draws only the corner handle and fills via the host when released outside", async () => {
    const saved = vi.fn();
    const fixture = await mount([cellNavigation(), editing<Row>(saved)]);
    expect(part("fill-handle")).toBeNull();
    cells()[0]!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    window.dispatchEvent(new MouseEvent("mouseup"));
    await fixture.whenStable();
    const handle = part("fill-handle")!;
    expect(handle.closest("td")).toBe(cells()[0]);
    expect(part("fill-handle-anchor")).not.toBeNull();
    expect(handle.title).toBe("Fill from selection");
    expect(handle.getAttribute("aria-hidden")).toBe("true");
    expect(handle.style.insetInlineEnd).toBe("-3px");
    handle.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    );
    cells()[1]!.dispatchEvent(new MouseEvent("mouseenter"));
    window.dispatchEvent(new MouseEvent("mouseup"));
    await fixture.whenStable();
    expect(saved).toHaveBeenCalledExactlyOnceWith(
      fixture.componentInstance.data[1],
      "name",
      "First"
    );
    expect(part("fill-handle")!.closest("td")).toBe(cells()[1]);
  });

  it("undoes a multi-cell paste as exactly one gesture", async () => {
    const saved = vi.fn();
    vi.stubGlobal("navigator", {
      clipboard: { readText: vi.fn().mockResolvedValue("One\nTwo") },
    });
    const fixture = await mount([
      cellNavigation(),
      editing<Row>(saved),
      editHistory(),
      undoRedoButtons(),
    ]);
    cells()[0]!.focus();
    cells()[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "v", ctrlKey: true, bubbles: true })
    );
    await fixture.whenStable();
    expect(saved.mock.calls.map((call) => call[2])).toEqual(["One", "Two"]);
    const undo = part<HTMLButtonElement>("undo-button")!;
    expect(undo.disabled).toBe(false);
    saved.mockClear();
    undo.click();
    await fixture.whenStable();
    expect(saved).toHaveBeenCalledTimes(2);
    expect(
      saved.mock.calls
        .map((call) => call[2])
        .sort((left, right) => left.localeCompare(right))
    ).toEqual(["First", "Second"]);
    expect(undo.disabled).toBe(true);
    expect(part<HTMLButtonElement>("redo-button")!.disabled).toBe(false);
  });

  it("has no fill affordance without write authority", async () => {
    const fixture = await mount([cellNavigation()]);
    cells()[0]!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    window.dispatchEvent(new MouseEvent("mouseup"));
    await fixture.whenStable();
    expect(part("fill-handle")).toBeNull();
  });

  it("keeps mobile cards inline-editable without the desktop drag affordance", async () => {
    const saved = vi.fn();
    const fixture = await mount([cellNavigation(), editing<Row>(saved)], true);
    expect(part("fill-handle")).toBeNull();
    part("edit-cell-activate")!.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true })
    );
    await fixture.whenStable();
    const editor = part<HTMLInputElement>("edit-cell-editor")!;
    editor.value = "Card value";
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    await fixture.whenStable();
    expect(saved).toHaveBeenCalledExactlyOnceWith(
      fixture.componentInstance.data[0],
      "name",
      "Card value"
    );
  });
});
