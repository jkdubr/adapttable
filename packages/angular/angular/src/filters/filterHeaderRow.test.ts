/**
 * The compact header-filter row: one control per filter shape, pads and
 * spacers aligned with the leaf header, and nothing when the row is off.
 */
import {
  defaultLabels,
  type ExtraFilters,
  type FilterDef,
  type FilterFormSource,
  type FilterTypeRegistry,
  type FilterTypeSpec,
} from "@adapttable/core";
import type {
  FilterHeaderClassNames,
  FilterHeaderMultiProps,
  FilterHeaderRangeProps,
  FilterHeaderSearchProps,
  FilterHeaderSelectProps,
} from "@adapttable/core/binding";
import { Component, computed, input, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";

import {
  AdaptFilterHeaderChrome,
  type FilterHeaderSlots,
} from "./filterHeaderRow";

interface Row {
  name: string;
  team: string;
  tags: string[];
  core: boolean;
  age: number;
  hired: string;
}

const DEFS: FilterDef<Row>[] = [
  { key: "name", type: "text", label: "Name" },
  {
    key: "team",
    type: "select",
    label: "Team",
    options: [
      { value: "Core", label: "Core" },
      { value: "Web", label: "Web" },
    ],
  },
  {
    key: "tags",
    type: "multiSelect",
    label: "Tags",
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
  { key: "core", type: "boolean", label: "Core" },
  { key: "age", type: "numberRange", label: "Age" },
  { key: "hired", type: "dateRange", label: "Hired" },
];

const COLUMNS = [
  { key: "name" },
  { key: "team" },
  { key: "tags" },
  { key: "core" },
  { key: "age" },
  { key: "hired" },
  { key: "note" },
];

@Component({
  selector: "test-search",
  template: `<input
    type="search"
    [attr.aria-label]="props().label"
    [value]="props().value"
    (input)="props().onChange($any($event.target).value)"
  />`,
})
class TestSearch {
  readonly props = input.required<FilterHeaderSearchProps>();
}

@Component({
  selector: "test-select",
  template: `<select
    [attr.aria-label]="props().label"
    [value]="props().value"
    (change)="props().onChange($any($event.target).value)"
  >
    @for (option of props().options; track option.value) {
      <option
        [value]="option.value"
        [selected]="option.value === props().value"
      >
        {{ option.label }}
      </option>
    }
  </select>`,
})
class TestSelect {
  readonly props = input.required<FilterHeaderSelectProps>();
}

@Component({
  selector: "test-range",
  template: `<input
    [attr.type]="props().type"
    [attr.aria-label]="props().label"
    [value]="props().value"
    (input)="props().onChange($any($event.target).value)"
  />`,
})
class TestRange {
  readonly props = input.required<FilterHeaderRangeProps>();
}

@Component({
  selector: "test-multi",
  template: `<span class="summary">{{ props().summary }}</span>
    @for (option of props().options; track option.value) {
      <label>
        <input
          type="checkbox"
          [checked]="props().selected.includes(option.value)"
          (change)="props().onToggle(option.value, $any($event.target).checked)"
        />{{ option.label }}
      </label>
    }`,
})
class TestMulti {
  readonly props = input.required<FilterHeaderMultiProps>();
}

const SLOTS: FilterHeaderSlots = {
  Search: TestSearch,
  Select: TestSelect,
  Range: TestRange,
  Multi: TestMulti,
};

function sourceFrom(
  extra: ReturnType<typeof signal<ExtraFilters>>
): FilterFormSource<Row> {
  return {
    get extra() {
      return extra();
    },
    setExtra: (key, value) => {
      extra.update((prev) => ({ ...prev, [key]: value }));
    },
    setExtras: (patch) => {
      extra.update((prev) => ({ ...prev, ...patch }));
    },
  };
}

@Component({
  imports: [AdaptFilterHeaderChrome],
  template: `
    <table>
      <thead>
        <adapt-filter-header-chrome
          [enabled]="enabled()"
          [columns]="columns()"
          [defs]="defs()"
          [source]="source()"
          [labels]="labels"
          [slots]="slots"
          [registry]="registry()"
          [expandable]="expandable()"
          [showReorder]="showReorder()"
          [selection]="selection()"
          [showActions]="showActions()"
          [columnSpacers]="spacers()"
          [stickyAttr]="sticky()"
          [pinSide]="pin()"
          [cellStyle]="styleFor()"
          [padStyle]="pad()"
          [classNames]="classes()"
        />
      </thead>
    </table>
  `,
})
class Host {
  readonly labels = defaultLabels;
  readonly slots = SLOTS;
  readonly extra = signal<ExtraFilters>({});
  readonly enabled = signal(true);
  readonly columns = signal(COLUMNS);
  readonly defs = signal<readonly FilterDef<Row>[]>(DEFS);
  readonly registry = signal<FilterTypeRegistry | undefined>(undefined);
  readonly expandable = signal(false);
  readonly showReorder = signal(false);
  readonly selection = signal(false);
  readonly showActions = signal(false);
  readonly spacers = signal<{ start: number; end: number } | undefined>(
    undefined
  );
  readonly sticky = signal<true | undefined>(undefined);
  readonly classes = signal<FilterHeaderClassNames | undefined>(undefined);
  readonly pin = signal<
    ((key: string) => "start" | "end" | undefined) | undefined
  >(undefined);
  readonly styleFor = signal<
    | ((column: {
        readonly key: string;
      }) => Readonly<Record<string, string>> | undefined)
    | undefined
  >(undefined);
  readonly pad = signal<Readonly<Record<string, string>> | undefined>(
    undefined
  );
  readonly source = computed(() => sourceFrom(this.extra));
}

async function mount(prepare?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  prepare?.(fixture.componentInstance);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const labeled = (name: string) =>
    [...element.querySelectorAll<HTMLElement>("[aria-label]")].filter(
      (node) => node.getAttribute("aria-label") === name
    );
  const typeInto = (field: HTMLInputElement | undefined, value: string) => {
    if (!field) throw new Error("field is not rendered");
    field.value = value;
    field.dispatchEvent(new Event("input"));
  };
  const choose = (field: HTMLSelectElement | undefined, value: string) => {
    if (!field) throw new Error("select is not rendered");
    field.value = value;
    field.dispatchEvent(new Event("change"));
  };
  return {
    host: fixture.componentInstance,
    element,
    fixture,
    labeled,
    typeInto,
    choose,
  };
}

const row = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(
    '[data-adapttable-part="filter-header-row"]'
  );

describe("AdaptFilterHeaderChrome", () => {
  it("writes every compact header widget", async () => {
    const { element, labeled, typeInto, choose, fixture } = await mount();
    expect(row(element)?.getAttribute("aria-label")).toBe(
      defaultLabels.headerFilters
    );
    const name = labeled("Name")[0] as HTMLInputElement;
    typeInto(name, "Ada");
    await fixture.whenStable();
    expect(name.value).toBe("Ada");
    const team = labeled("Team")[0] as HTMLSelectElement;
    choose(team, "Web");
    await fixture.whenStable();
    expect(team.value).toBe("Web");
    const tags = element.querySelector(".summary");
    const box = (caption: string) => {
      const label = [...element.querySelectorAll("label")].find((node) =>
        node.textContent?.includes(caption)
      );
      return label?.querySelector("input");
    };
    const first = box("A");
    const second = box("B");
    if (!first || !second) throw new Error("tag checkboxes are not rendered");
    first.checked = true;
    first.dispatchEvent(new Event("change"));
    await fixture.whenStable();
    second.checked = true;
    second.dispatchEvent(new Event("change"));
    await fixture.whenStable();
    expect(tags?.textContent ?? "").toContain("(2)");
    const core = labeled("Core")[0] as HTMLSelectElement;
    choose(core, "true");
    await fixture.whenStable();
    expect(core.value).toBe("true");
    const age = labeled("Age")[0] as HTMLInputElement;
    expect(labeled("Age")).toHaveLength(1);
    typeInto(age, "30");
    await fixture.whenStable();
    expect(age.value).toBe("30");
    const hired = labeled("Hired")[0] as HTMLInputElement;
    expect(hired.type).toBe("date");
    typeInto(hired, "2024-01-01");
    await fixture.whenStable();
    expect(hired.value).toBe("2024-01-01");
    expect(
      element.querySelector('[data-column-key="note"]')?.textContent?.trim()
    ).toBe("");
  });

  it("writes the upper bound of a between pair", async () => {
    const { labeled, typeInto, fixture } = await mount((host) => {
      host.extra.set({ ageOp: "between", ageMin: "10", ageMax: "40" });
    });
    const bounds = labeled("Age") as HTMLInputElement[];
    expect(bounds).toHaveLength(2);
    typeInto(bounds[1], "50");
    await fixture.whenStable();
    expect(bounds[1]?.value).toBe("50");
  });

  it("pads the row, sticks cells, and hides when disabled or empty", async () => {
    const { host, element, fixture } = await mount();
    expect(
      element.querySelector('[data-adapttable-part="expand-header"]')
    ).toBeNull();
    host.expandable.set(true);
    host.showReorder.set(true);
    host.selection.set(true);
    host.showActions.set(true);
    host.spacers.set({ start: 12, end: 8 });
    host.sticky.set(true);
    host.pad.set({ width: "24px" });
    host.pin.set((key) => (key === "name" ? "start" : undefined));
    host.styleFor.set((column) =>
      column.key === "name" ? { width: "80px" } : undefined
    );
    host.classes.set({
      filterHeaderRow: "row",
      headerCell: "cell",
      filterHeaderCell: "filter",
      expandHeader: "expand",
      filterHeaderInput: "input",
      filterHeaderMenu: "menu",
    });
    await fixture.whenStable();
    expect(row(element)?.className).toContain("row");
    expect(
      element.querySelector('[data-adapttable-part="expand-header"]')?.className
    ).toContain("expand");
    expect(
      element.querySelector('[data-adapttable-part="reorder-header"]')
    ).not.toBeNull();
    expect(
      element.querySelector('[data-adapttable-part="selection-header"]')
    ).not.toBeNull();
    expect(
      element.querySelector('[data-adapttable-part="actions-header"]')
    ).not.toBeNull();
    expect(
      element.querySelector('[data-adapttable-part="column-spacer-start"]')
    ).not.toBeNull();
    expect(
      element.querySelector('[data-adapttable-part="column-spacer-end"]')
    ).not.toBeNull();
    const nameCell = element.querySelector('[data-column-key="name"]');
    expect(nameCell?.getAttribute("data-sticky")).toBe("true");
    expect(nameCell?.getAttribute("data-pinned")).toBe("start");
    expect((nameCell as HTMLElement).style.width).toBe("80px");
    host.enabled.set(false);
    await fixture.whenStable();
    expect(row(element)).toBeNull();
    host.enabled.set(true);
    host.defs.set([]);
    await fixture.whenStable();
    expect(row(element)).toBeNull();
  });

  it("shows a custom caption and falls through when the render is empty", async () => {
    const registry: FilterTypeRegistry = {
      get: (type) => {
        if (type === "note") {
          return { render: () => "Pinned" } as unknown as FilterTypeSpec;
        }
        if (type === "blank") {
          return {
            render: () => "",
            widget: "text",
          } as unknown as FilterTypeSpec;
        }
        if (type === "count") {
          return { render: () => 3 } as unknown as FilterTypeSpec;
        }
        if (type === "zero") {
          return {
            render: () => 0,
            widget: "text",
          } as unknown as FilterTypeSpec;
        }
        return undefined;
      },
      has: () => true,
      types: () => ["note", "blank", "count", "zero"],
    };
    const { element, labeled } = await mount((host) => {
      host.registry.set(registry);
      host.columns.set([
        { key: "note" },
        { key: "blank" },
        { key: "count" },
        { key: "zero" },
      ]);
      host.defs.set([
        { key: "note", type: "note", label: "Note" },
        { key: "blank", type: "blank", label: "Blank" },
        { key: "count", type: "count", label: "Count" },
        { key: "zero", type: "zero", label: "Zero" },
      ]);
    });
    expect(
      element.querySelector('[data-column-key="note"]')?.textContent?.trim()
    ).toBe("Pinned");
    expect(
      element.querySelector('[data-column-key="count"]')?.textContent?.trim()
    ).toBe("3");
    expect(labeled("Blank")).toHaveLength(1);
    expect(labeled("Zero")).toHaveLength(1);
    expect(element.querySelector('[data-column-key="note"] input')).toBeNull();
  });
});
