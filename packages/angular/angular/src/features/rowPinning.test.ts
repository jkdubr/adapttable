/**
 * The row-pinning feature and its live state: the lists in the URL unless
 * the host holds them, and refused while grouping or a tree is armed.
 */
import {
  createMemoryAdapter,
  resolveLabels,
  type RowPinState,
} from "@adapttable/core";
import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";

import { featureOptionsOf } from "../featureHost";
import {
  injectTableRowPinning,
  rowPinning,
  type TableRowPinningOptions,
} from "./rowPinning";

interface Row {
  id: string;
}

function liveWith(options: Partial<TableRowPinningOptions<Row>> = {}) {
  const urlAdapter = createMemoryAdapter();
  const blocked = signal(false);
  const pinning = TestBed.runInInjectionContext(() =>
    injectTableRowPinning<Row>({
      features: [rowPinning()],
      getRowId: (row) => row.id,
      labels: signal(resolveLabels(undefined)),
      blocked,
      urlAdapter,
      ...options,
    })
  );
  return { pinning, urlAdapter, blocked };
}

describe("rowPinning()", () => {
  it("arms pinning, and carries the host's lists", () => {
    expect(featureOptionsOf([rowPinning()])).toEqual({
      rowPinningArmed: true,
    });
    const pinnedRowIds = { top: ["a"], bottom: [] };
    expect(featureOptionsOf([rowPinning({ pinnedRowIds })])).toEqual({
      rowPinningArmed: true,
      pinnedRowIds,
    });
  });
});

describe("injectTableRowPinning", () => {
  it("is absent while pinning is not composed", () => {
    expect(
      TestBed.runInInjectionContext(() =>
        injectTableRowPinning<Row>({
          features: [],
          getRowId: (row) => row.id,
          labels: signal(resolveLabels(undefined)),
          blocked: signal(false),
        })
      )
    ).toBeUndefined();
  });

  it("keeps the table's own lists in the URL", () => {
    const { pinning, urlAdapter } = liveWith();
    pinning!()!.pin("a", "top");
    expect(urlAdapter.getSearch()).toContain("rowPin");
    expect(pinning!()!.sideOf("a")).toBe("top");
  });

  it("leaves the URL alone when the host holds the lists, and tells the host", () => {
    const onPinnedRowIdsChange = vi.fn();
    const pinnedRowIds: RowPinState = { top: [], bottom: [] };
    const { pinning, urlAdapter } = liveWith({
      features: [rowPinning({ pinnedRowIds, onPinnedRowIdsChange })],
    });
    pinning!()!.pin("a", "bottom");
    expect(onPinnedRowIdsChange).toHaveBeenCalledWith({
      top: [],
      bottom: ["a"],
    });
    expect(urlAdapter.getSearch()).not.toContain("rowPin");
  });

  it("observes a table's own lists without holding them", () => {
    const onPinnedRowIdsChange = vi.fn();
    const { pinning } = liveWith({
      features: [rowPinning({ onPinnedRowIdsChange })],
    });
    pinning!()!.pin("a", "top");
    expect(onPinnedRowIdsChange).toHaveBeenCalledWith({
      top: ["a"],
      bottom: [],
    });
    expect(pinning!()!.sideOf("a")).toBe("top");
  });

  it("is refused while grouping or a tree is armed, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { pinning, blocked } = liveWith();
    blocked.set(true);
    TestBed.tick();
    expect(pinning!()).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("row pinning is ignored")
    );
  });
});
