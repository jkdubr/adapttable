import { AdaptCellTemplate, type ColumnDef } from "@adapttable/angular";
import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { AdaptDataTable } from "./dataTable";

interface City {
  id: string;
  name: string;
  country: string;
}

const CITIES: City[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: `City ${String(i + 1).padStart(2, "0")}`,
  country: i % 2 === 0 ? "UAE" : "Jordan",
}));

const COLUMNS: ColumnDef<City>[] = [
  { key: "name", sortable: true, accessor: (row) => row.name },
  { key: "country", mobileLabel: "Land", accessor: (row) => row.country },
];

@Component({
  imports: [AdaptDataTable, AdaptCellTemplate],
  template: `
    <adapt-data-table
      [data]="data()"
      [columns]="columns"
      [rowKey]="rowKey"
      [urlSync]="false"
      [defaults]="{ limit: 5 }"
      [forceMobile]="mobile()"
      [selectable]="true"
      [selectedIds]="selected()"
      searchPlaceholder="Find a city"
      (selectionChange)="changes.push($event)"
    >
      <ng-template adaptCellTemplate="country" let-value="value">
        <b class="country">{{ value }}</b>
      </ng-template>
    </adapt-data-table>
  `,
})
class Host {
  readonly data = signal<readonly City[]>(CITIES);
  readonly mobile = signal<boolean | undefined>(undefined);
  readonly selected = signal<readonly string[] | undefined>(undefined);
  readonly columns = COLUMNS;
  readonly rowKey = (row: City) => row.id;
  readonly changes: string[][] = [];
}

async function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const part = <T extends HTMLElement>(name: string) =>
    element.querySelector<T>(`[data-adapttable-part="${name}"]`);
  const parts = <T extends HTMLElement>(name: string) => [
    ...element.querySelectorAll<T>(`[data-adapttable-part="${name}"]`),
  ];
  const ids = () => parts("row").map((row) => row.dataset.rowId);
  return {
    fixture,
    element,
    part,
    parts,
    ids,
    settle: () => fixture.whenStable(),
  };
}

describe("the unstyled Angular table", () => {
  it("follows the viewport when the host does not force a layout", async () => {
    const { part, ids } = await mount();
    // No `matchMedia` in the test environment: the desktop table.
    expect(part("table")).not.toBeNull();
    expect(ids()).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("fills a column from the host's cell template", async () => {
    const { element } = await mount();
    expect(element.querySelector(".country")?.textContent?.trim()).toBe("UAE");
  });

  it("pages from the numbered pager and the page-size select", async () => {
    const { part, parts, ids, settle } = await mount();
    const numbers = parts<HTMLButtonElement>("page-number");
    expect(numbers.map((button) => button.textContent?.trim())).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ]);
    expect(numbers[0]?.getAttribute("aria-current")).toBe("page");
    expect(part<HTMLButtonElement>("page-prev")?.disabled).toBe(true);
    numbers[2]?.click();
    await settle();
    expect(ids()).toEqual(["11", "12", "13", "14", "15"]);
    part<HTMLButtonElement>("page-prev")?.click();
    await settle();
    expect(ids()).toEqual(["6", "7", "8", "9", "10"]);
    const select = part<HTMLSelectElement>("rows-per-page");
    expect(select?.value).toBe("5");
    if (!select) return;
    select.value = "10";
    select.dispatchEvent(new Event("change"));
    await settle();
    expect(ids().length).toBe(10);
  });

  it("searches, says nothing matched, and offers to clear", async () => {
    const { part, parts, settle } = await mount();
    const search = part<HTMLInputElement>("search");
    expect(search?.placeholder).toBe("Find a city");
    if (!search) return;
    search.value = "Atlantis";
    search.dispatchEvent(new Event("input"));
    await new Promise((resolve) => setTimeout(resolve, 350));
    await settle();
    expect(part("empty")?.textContent).toContain("No results");
    expect(parts("row").length).toBe(0);
    expect(part("footer")).toBeNull();
    part<HTMLButtonElement>("empty-clear")?.click();
    await settle();
    // Clearing filters leaves the search: the host typed it.
    expect(part("empty")).not.toBeNull();
  });

  it("reports selection changes and shows the ids the host controls", async () => {
    const { fixture, part, parts, settle } = await mount();
    parts<HTMLInputElement>("checkbox")[1]?.click();
    await settle();
    expect(fixture.componentInstance.changes.at(-1)).toEqual(["1"]);
    part<HTMLInputElement>("checkbox")?.click();
    await settle();
    expect(fixture.componentInstance.changes.at(-1)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    fixture.componentInstance.selected.set(["3"]);
    await settle();
    expect(
      parts("row").map((row) => row.getAttribute("aria-selected"))
    ).toEqual(["false", "false", "true", "false", "false"]);
  });

  it("loads more rows on a phone instead of paging", async () => {
    const { fixture, part, parts, settle } = await mount();
    fixture.componentInstance.mobile.set(true);
    await settle();
    expect(part("footer")).toBeNull();
    expect(parts("card").length).toBe(5);
    const button = part<HTMLButtonElement>("load-more-button");
    expect(button?.textContent?.trim()).toBe("Load more");
    button?.click();
    await settle();
    expect(parts("card").length).toBe(10);
  });

  it("gives every card its label and a checkbox on a phone", async () => {
    const { fixture, parts, settle } = await mount();
    fixture.componentInstance.mobile.set(true);
    await settle();
    const cards = parts("card");
    expect(cards.length).toBeGreaterThan(0);
    expect(
      parts("card-label")
        .slice(0, 2)
        .map((label) => label.textContent?.trim())
    ).toEqual(["Name", "Land"]);
    cards[0]?.querySelector<HTMLInputElement>("input")?.click();
    await settle();
    expect(fixture.componentInstance.changes.at(-1)).toEqual(["1"]);
    expect(parts("card")[0]?.hasAttribute("data-selected")).toBe(true);
  });
});
