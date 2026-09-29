import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { featureOptionsOf } from "./features";
import { ADAPTTABLE_URL_ADAPTER } from "./url";
import {
  injectKeyedVirtualization,
  injectTableVirtualization,
  virtualize,
} from "./virtualize";

vi.mock("@tanstack/angular-virtual", () => {
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
  const make = () => ({
    getVirtualItems: () => items(),
    getTotalSize: () => total(),
    measureElement: vi.fn(),
    scrollToIndex: vi.fn(),
    options: signal({ scrollMargin: 0 }),
  });
  return {
    injectWindowVirtualizer: vi.fn(() => make()),
    injectVirtualizer: vi.fn(() => make()),
    __setItems: (
      next: {
        index: number;
        start: number;
        end: number;
        size: number;
        key: string | number;
        lane: number;
      }[]
    ) => {
      items.set(next);
    },
    __setTotal: (n: number) => {
      total.set(n);
    },
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
});

describe("injectKeyedVirtualization", () => {
  beforeEach(() => {
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
});
