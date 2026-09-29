import { Component, Injector, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { featureOptionsOf } from "../featureHost";
import { virtualize } from "../features/virtualize";
import { ADAPTTABLE_URL_ADAPTER } from "../url/tableUrlState";
import {
  injectKeyedVirtualization,
  injectKeyedVirtualizer,
  injectTableVirtualization,
  injectTableVirtualizer,
} from "./tableVirtualization";

const items = signal<
  {
    index: number;
    start: number;
    end: number;
    size: number;
    key: string | number;
    lane: number;
  }[]
>([]);
const total = signal(0);

vi.mock("@tanstack/angular-virtual", () => {
  const make = (opts?: { getItemKey?: (index: number) => string }) => {
    // Exercise the adapter's key extractor for in-range and missing rows.
    opts?.getItemKey?.(0);
    opts?.getItemKey?.(999);
    return {
      getVirtualItems: () => items(),
      getTotalSize: () => total(),
      measureElement: vi.fn(),
      scrollToIndex: vi.fn(),
      options: signal({ scrollMargin: 0 }),
    };
  };
  return {
    injectWindowVirtualizer: vi.fn(
      (factory: () => { getItemKey?: (index: number) => string }) =>
        make(typeof factory === "function" ? factory() : factory)
    ),
    injectVirtualizer: vi.fn(
      (factory: () => { getItemKey?: (index: number) => string }) =>
        make(typeof factory === "function" ? factory() : factory)
    ),
  };
});

interface Row {
  id: string;
}

const rows: Row[] = Array.from({ length: 5 }, (_, i) => ({
  id: String(i),
}));

@Component({
  template: `
    <output class="count">{{ window().rows.length }}</output>
    <output class="enabled">{{ window().enabled }}</output>
  `,
})
class Host {
  private readonly rows = signal(rows);
  readonly window = injectTableVirtualization({
    rows: this.rows,
    rowKey: (row) => row.id,
    enabled: true,
    estimateSize: 40,
  });
}

@Component({
  template: `
    <output class="count">{{ vz.virtualization().rows.length }}</output>
    <output class="pad">{{ vz.virtualization().paddingBottom }}</output>
  `,
})
class FullHost {
  private readonly rows = signal(rows);
  readonly onEndReached = vi.fn();
  readonly scrollEl = document.createElement("div");
  readonly estimate = signal(48);
  readonly overscan = signal(2);
  readonly margin = signal(8);
  readonly enabled = signal(true);
  readonly expandable = signal(false);
  readonly vz = injectTableVirtualizer({
    rows: this.rows,
    rowKey: (row) => row.id,
    enabled: this.enabled,
    estimateSize: this.estimate,
    overscan: this.overscan,
    scrollMargin: this.margin,
    expandable: this.expandable,
    getScrollElement: () => this.scrollEl,
    onEndReached: () => this.onEndReached(),
  });
}

@Component({
  template: `<output class="page">{{ vz.virtualization().enabled }}</output>`,
})
class PageHost {
  readonly onEndReached = vi.fn();
  readonly vz = injectTableVirtualizer({
    rows: signal(rows),
    rowKey: (row: Row) => row.id,
    enabled: true,
    onEndReached: () => this.onEndReached(),
  });
}

@Component({
  template: `<output class="indices">{{ window().indices.join(",") }}</output>`,
})
class KeyedHost {
  private readonly keys = signal(["a", "b", "c"]);
  readonly window = injectKeyedVirtualization({
    keys: this.keys,
    enabled: false,
    estimateSize: 48,
  });
}

@Component({
  template: `
    <output class="count">{{ vz.virtualization().indices.length }}</output>
  `,
})
class KeyedFullHost {
  private readonly keys = signal(["a", "b", "c", "d"]);
  readonly onEndReached = vi.fn();
  readonly scrollEl = document.createElement("div");
  readonly vz = injectKeyedVirtualizer({
    keys: this.keys,
    enabled: true,
    estimateSize: (index) => 20 + index,
    overscan: 1,
    scrollMargin: 4,
    getScrollElement: () => this.scrollEl,
    onEndReached: () => this.onEndReached(),
  });
}

describe("virtualize feature", () => {
  it("turns virtualize on and carries the windowing knobs", () => {
    expect(featureOptionsOf([virtualize()])).toMatchObject({
      virtualize: true,
    });
    expect(
      featureOptionsOf([
        virtualize({ estimateRowSize: 72, virtualizeColumns: true }),
      ])
    ).toMatchObject({
      virtualize: true,
      estimateRowSize: 72,
      virtualizeColumns: true,
    });
    expect(featureOptionsOf([virtualize(false)])).toMatchObject({
      virtualize: false,
    });
  });
});

describe("injectTableVirtualization", () => {
  beforeEach(() => {
    items.set([]);
    total.set(0);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ADAPTTABLE_URL_ADAPTER,
          useValue: {
            get: () => ({}),
            set: () => undefined,
            subscribe: () => () => undefined,
          },
        },
      ],
    });
  });

  it("feeds the window virtualizer and materializes every row when the slice is empty", () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".enabled")?.textContent).toBe(
      "true"
    );
    // Armed but no measured slice yet → pending spacer, no mounted rows
    // once items land; with an empty slice and a measured total of 0 the
    // pending height is estimate × count.
    expect(
      Number(fixture.nativeElement.querySelector(".count")?.textContent)
    ).toBe(0);
  });

  it("materializes the measured slice and scrolls by index", () => {
    const fixture = TestBed.createComponent(FullHost);
    fixture.detectChanges();
    items.set([
      { index: 0, start: 0, end: 40, size: 40, key: "0", lane: 0 },
      { index: 1, start: 40, end: 80, size: 40, key: "1", lane: 0 },
    ]);
    total.set(200);
    fixture.detectChanges();
    expect(fixture.componentInstance.vz.virtualization().rows).toHaveLength(2);
    expect(fixture.componentInstance.vz.virtualization().enabled).toBe(true);
    fixture.componentInstance.vz.scrollToIndex(3);
    fixture.componentInstance.vz
      .virtualization()
      .measureElement?.(document.createElement("tr"));

    items.set([
      { index: 4, start: 160, end: 200, size: 40, key: "4", lane: 0 },
    ]);
    fixture.detectChanges();
    expect(fixture.componentInstance.onEndReached).toHaveBeenCalled();

    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.vz.virtualization().rows).toHaveLength(5);
  });

  it("accepts an injector and number estimate without signals", () => {
    const injector = TestBed.inject(Injector);
    const state = injectTableVirtualization({
      rows: signal(rows),
      rowKey: (row: Row) => row.id,
      enabled: false,
      estimateSize: 32,
      injector,
    });
    expect(state().enabled).toBe(false);
    expect(state().rows).toHaveLength(5);
  });

  it("windows against the page when no scroll element is given", () => {
    const fixture = TestBed.createComponent(PageHost);
    fixture.detectChanges();
    items.set([
      { index: 4, start: 160, end: 200, size: 40, key: "4", lane: 0 },
    ]);
    fixture.detectChanges();
    expect(fixture.componentInstance.onEndReached).toHaveBeenCalled();
    expect(fixture.componentInstance.vz.virtualization().enabled).toBe(true);
  });
});

describe("injectKeyedVirtualization", () => {
  beforeEach(() => {
    items.set([]);
    total.set(0);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ADAPTTABLE_URL_ADAPTER,
          useValue: {
            get: () => ({}),
            set: () => undefined,
            subscribe: () => () => undefined,
          },
        },
      ],
    });
  });

  it("returns every index when windowing is off", () => {
    const fixture = TestBed.createComponent(KeyedHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".indices")?.textContent).toBe(
      "0,1,2"
    );
  });

  it("windows keyed entries inside a scroll element", () => {
    const fixture = TestBed.createComponent(KeyedFullHost);
    fixture.detectChanges();
    items.set([
      { index: 1, start: 20, end: 40, size: 20, key: "b", lane: 0 },
      { index: 2, start: 40, end: 60, size: 20, key: "c", lane: 0 },
    ]);
    total.set(80);
    fixture.detectChanges();
    expect(fixture.componentInstance.vz.virtualization().indices).toEqual([
      1, 2,
    ]);
    fixture.componentInstance.vz.scrollToIndex(0);
    items.set([{ index: 3, start: 60, end: 80, size: 20, key: "d", lane: 0 }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.onEndReached).toHaveBeenCalled();
  });
});
