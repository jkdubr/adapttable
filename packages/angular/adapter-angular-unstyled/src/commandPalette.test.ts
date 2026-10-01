/**
 * The unstyled command palette: the toolbar button, the dialog, and a command.
 */
import type { ToolbarExtrasSlotProps } from "@adapttable/angular";
import { commandPalette } from "@adapttable/angular-unstyled/command-palette";
import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";

import { AdaptCommandPaletteButton } from "../command-palette/palette";
import { AdaptDataTable } from "./dataTable";

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [{ id: "1", name: "Ada" }];

@Component({
  imports: [AdaptDataTable],
  template: `
    <adapt-data-table
      [data]="rows"
      [columns]="columns"
      [rowKey]="rowKey"
      [urlSync]="false"
      [forceMobile]="false"
      [features]="features"
    />
  `,
})
class Host {
  readonly rows = ROWS;
  readonly columns = [
    { key: "name", header: "Name", accessor: (row: Row) => row.name },
  ];
  readonly rowKey = (row: Row) => row.id;
  readonly greeted = vi.fn();
  readonly features = [
    commandPalette({
      button: true,
      commands: [
        {
          key: "greet",
          label: "Greet",
          onSelect: () => {
            this.greeted();
          },
        },
      ],
    }),
  ];
}

const part = (name: string) =>
  document.querySelector<HTMLElement>(`[data-adapttable-part="${name}"]`);

describe("command palette (unstyled Angular)", () => {
  it("opens from the toolbar button and runs a command", async () => {
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(part("command-palette")).toBeNull();
    part("command-palette-button")!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(part("command-palette")).not.toBeNull();
    expect(part("command-input")).not.toBeNull();
    expect(part("command-list")).not.toBeNull();
    const input = part("command-input") as HTMLInputElement;
    input.value = "zzz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(part("command-empty")?.textContent).toContain("No matching command");
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const greet = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-adapttable-part="command-item"]'
      ),
    ].find((item) => item.textContent?.includes("Greet"));
    expect(greet).toBeTruthy();
    greet!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.greeted).toHaveBeenCalledOnce();
    expect(part("command-palette")).toBeNull();
  });

  it("omits the toolbar button unless the host asks, and draws nothing without the token", () => {
    expect(commandPalette(false)).toBeTruthy();
    expect(commandPalette({ button: false })).toBeTruthy();

    @Component({
      imports: [AdaptCommandPaletteButton],
      template: `<adapt-command-palette-button [props]="props" />`,
    })
    class BareButton {
      readonly props = {
        labels: { commandPalette: "Commands" },
      } as unknown as ToolbarExtrasSlotProps;
    }

    const fixture = TestBed.createComponent(BareButton);
    fixture.detectChanges();
    expect(part("command-palette-button")).toBeNull();
    fixture.destroy();
  });
});
