import type { ColumnDef, FilterDef } from "@adapttable/angular";
import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { AdaptDataTable } from "./dataTable";
import { filters, headerFilters } from "./features";
import type { FiltersMode } from "./tableFilters";

interface Person {
  id: string;
  name: string;
  city: string;
  age: number;
  active: boolean;
  joined: string;
  team: string;
}

const PEOPLE: Person[] = [
  {
    id: "1",
    name: "Ada",
    city: "Dubai",
    age: 36,
    active: true,
    joined: "2020-01-10",
    team: "a",
  },
  {
    id: "2",
    name: "Grace",
    city: "Amman",
    age: 28,
    active: false,
    joined: "2021-06-01",
    team: "b",
  },
  {
    id: "3",
    name: "Linus",
    city: "Dubai",
    age: 54,
    active: true,
    joined: "2019-03-15",
    team: "b",
  },
];

const COLUMNS: ColumnDef<Person>[] = [
  { key: "name", accessor: (row) => row.name },
  { key: "city", accessor: (row) => row.city },
  { key: "age", accessor: (row) => row.age },
];

const DEFS: FilterDef<Person>[] = [
  { key: "name", type: "text" },
  {
    key: "city",
    type: "select",
    options: [
      { value: "Dubai", label: "Dubai" },
      { value: "Amman", label: "Amman" },
    ],
  },
  { key: "age", type: "numberRange" },
  { key: "active", type: "boolean" },
  { key: "joined", type: "dateRange" },
  {
    key: "team",
    type: "multiSelect",
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
];

@Component({
  imports: [AdaptDataTable],
  template: `
    <adapt-data-table
      [data]="data"
      [columns]="columns"
      [rowKey]="rowKey"
      [urlSync]="false"
      [forceMobile]="false"
      [features]="features()"
      [filtersMode]="mode()"
    />
  `,
})
class Host {
  readonly features = input([filters(DEFS)]);
  readonly mode = input<FiltersMode>("popover");
  readonly data = PEOPLE;
  readonly columns = COLUMNS;
  readonly rowKey = (row: Person) => row.id;
}

async function mount(
  features = [filters(DEFS)],
  mode: FiltersMode = "popover"
) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentRef.setInput("features", features);
  fixture.componentRef.setInput("mode", mode);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  const part = <T extends HTMLElement>(
    name: string,
    root: ParentNode = element
  ) => root.querySelector<T>(`[data-adapttable-part="${name}"]`);
  const parts = <T extends HTMLElement>(
    name: string,
    root: ParentNode = element
  ) => [...root.querySelectorAll<T>(`[data-adapttable-part="${name}"]`)];
  const ids = () => parts("row").map((row) => row.dataset.rowId);
  const settle = () => fixture.whenStable();
  const field = (caption: string) =>
    parts("filter-field").find(
      (candidate) =>
        part("filter-label", candidate)?.textContent?.trim() === caption
    );
  const type = async (control: Element | null | undefined, value: string) => {
    const target = control as HTMLInputElement | HTMLSelectElement | null;
    if (!target) return;
    target.value = value;
    target.dispatchEvent(
      new Event(target instanceof HTMLSelectElement ? "change" : "input")
    );
    await settle();
  };
  const openFilters = async () => {
    part<HTMLButtonElement>("filters-button")?.click();
    await settle();
  };
  return {
    fixture,
    element,
    part,
    parts,
    ids,
    settle,
    field,
    type,
    openFilters,
  };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("the unstyled Angular filters", () => {
  it("opens an anchored popover from the Filters button, and closes it", async () => {
    const { part, openFilters, settle } = await mount();
    const button = part<HTMLButtonElement>("filters-button");
    expect(button?.getAttribute("aria-expanded")).toBe("false");
    await openFilters();
    expect(button?.getAttribute("aria-expanded")).toBe("true");
    expect(part("filters-popover")).not.toBeNull();
    expect(part("filters-backdrop")).toBeNull();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await settle();
    expect(part("filters-popover")).toBeNull();
    expect(document.activeElement).toBe(button);
    await openFilters();
    document.body.click();
    await settle();
    expect(part("filters-popover")).toBeNull();
  });

  it("filters by text, and counts and chips what is set", async () => {
    const { part, parts, ids, field, type, openFilters } = await mount();
    await openFilters();
    await type(part("filter-input", field("Name")), "li");
    expect(ids()).toEqual(["3"]);
    expect(part("filters-count")?.textContent).toBe("1");
    expect(parts("chip")[0]?.textContent).toContain("Name");
    expect(part("filters-title")?.textContent).toContain("(1)");
  });

  it("changes a text filter's operator", async () => {
    const { part, ids, field, type, openFilters } = await mount();
    await openFilters();
    await type(part("filter-input", field("Name")), "a");
    await type(part("filter-operator", field("Name")), "startsWith");
    expect(ids()).toEqual(["1"]);
  });

  it("filters by a select, a yes/no and a group of checkboxes", async () => {
    const { part, parts, ids, field, type, openFilters, settle } =
      await mount();
    await openFilters();
    await type(part("filter-select", field("City")), "Dubai");
    expect(ids()).toEqual(["1", "3"]);
    await type(part("filter-select", field("Active")), "true");
    expect(ids()).toEqual(["1", "3"]);
    const boxes = parts<HTMLInputElement>("filter-checkbox", field("Team")).map(
      (label) => label.querySelector("input")
    );
    boxes[1]?.click();
    await settle();
    expect(ids()).toEqual(["3"]);
    boxes[1]?.click();
    await settle();
    expect(ids()).toEqual(["1", "3"]);
  });

  it("filters by a number range and a relative date", async () => {
    const { part, parts, ids, field, type, openFilters } = await mount();
    await openFilters();
    const age = field("Age");
    await type(part("filter-operator", age), "gt");
    await type(parts("filter-input", age)[0], "30");
    expect(ids()).toEqual(["1", "3"]);
    await type(part("filter-operator", age), "between");
    const [from, to] = parts<HTMLInputElement>("filter-input", age);
    await type(from, "30");
    await type(to, "40");
    expect(ids()).toEqual(["1"]);
    await type(part("filter-operator", age), "");
    expect(ids()).toEqual(["1", "2", "3"]);
    const joined = field("Joined");
    await type(part("filter-operator", joined), "relative");
    const preset = parts<HTMLSelectElement>("filter-input", joined)[0];
    await type(preset, "last");
    const count = parts<HTMLInputElement>("filter-input", joined)[1];
    expect(count?.type).toBe("number");
    await type(count, "3");
    expect(part("filters-count")).not.toBeNull();
  });

  it("removes a chip, and clears every filter", async () => {
    const { part, parts, ids, field, type, openFilters, settle } =
      await mount();
    await openFilters();
    await type(part("filter-select", field("City")), "Amman");
    expect(ids()).toEqual(["2"]);
    parts<HTMLButtonElement>("chip-remove")[0]?.click();
    await settle();
    expect(ids()).toEqual(["1", "2", "3"]);
    await type(part("filter-select", field("City")), "Amman");
    part<HTMLButtonElement>("filters-clear")?.click();
    await settle();
    expect(ids()).toEqual(["1", "2", "3"]);
    expect(part("chips")).toBeNull();
  });

  it("builds a nested AND/OR filter", async () => {
    const { part, parts, ids, settle, type, openFilters } = await mount();
    await openFilters();
    const summary = part("filter-tree-summary");
    expect(summary?.textContent).toContain("Advanced");
    const tree = part<HTMLDetailsElement>("filter-tree");
    if (!tree) return;
    tree.open = true;
    tree.dispatchEvent(new Event("toggle"));
    await settle();
    const addCondition = () =>
      [...(part("filter-tree-actions")?.querySelectorAll("button") ?? [])][0];
    addCondition()?.click();
    await settle();
    const condition = part("filter-tree-condition");
    expect(condition).not.toBeNull();
    await type(part("filter-input", condition ?? undefined), "Ada");
    expect(ids()).toEqual(["1"]);
    const chips = parts("chip");
    expect(chips.length).toBeGreaterThan(1);
    [
      ...(part("filter-tree-actions")?.querySelectorAll("button") ?? []),
    ][1]?.click();
    await settle();
    expect(parts("filter-tree-group").length).toBe(2);
    await type(
      part("filter-operator", part("filter-tree-group") ?? undefined),
      "or"
    );
    parts<HTMLButtonElement>("filter-tree-remove")[0]?.click();
    await settle();
    expect(ids()).toEqual(["1", "2", "3"]);
  });

  it("opens a drawer with a backdrop in drawer mode, and traps focus in it", async () => {
    const { part, openFilters, settle } = await mount(
      [filters(DEFS)],
      "drawer"
    );
    const button = part<HTMLButtonElement>("filters-button");
    expect(button?.hasAttribute("aria-expanded")).toBe(false);
    await openFilters();
    const panel = part("filters-panel");
    expect(panel).not.toBeNull();
    expect(part("filters-backdrop")).not.toBeNull();
    expect(document.activeElement).toBe(panel);
    const last = part<HTMLButtonElement>("filters-done");
    last?.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true })
    );
    part<HTMLButtonElement>("filters-done")?.click();
    await settle();
    expect(part("filters-panel")).toBeNull();
    await openFilters();
    part<HTMLButtonElement>("filters-backdrop")?.click();
    await settle();
    expect(part("filters-panel")).toBeNull();
    await openFilters();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await settle();
    expect(part("filters-panel")).toBeNull();
  });

  it("puts a funnel on each filterable header", async () => {
    const { part, parts, ids, field, type, settle, element } = await mount([
      filters(DEFS),
      headerFilters(),
    ]);
    const triggers = parts<HTMLDetailsElement>("filter-header-trigger");
    expect(triggers.length).toBe(3);
    const trigger = triggers[1];
    if (!trigger) return;
    trigger.open = true;
    trigger.dispatchEvent(new Event("toggle"));
    await settle();
    expect(part("filter-header-cell", trigger)).not.toBeNull();
    await type(part("filter-select", field("City")), "Amman");
    expect(ids()).toEqual(["2"]);
    expect(trigger.querySelector("summary")?.hasAttribute("data-active")).toBe(
      true
    );
    element.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    document.body.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true })
    );
    await settle();
  });

  it("says nothing matched when a filter leaves no rows", async () => {
    const { part, field, type, openFilters } = await mount();
    await openFilters();
    await type(part("filter-input", field("Name")), "nobody");
    expect(part("empty")?.textContent).toContain("No results");
  });
});
