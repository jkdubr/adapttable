/**
 * The changed-cell flash store: diffing patch events, one timer per row, and
 * reading nothing while not live.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CHANGED_CELL_FLASH_MS,
  changedRowFields,
  createChangedCellFlashStore,
  patchTouchedKeys,
} from "./changedCellFlash";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("changedRowFields", () => {
  it("lists the keys whose values differ", () => {
    expect(changedRowFields({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 })).toEqual([
      "b",
      "c",
    ]);
    expect(changedRowFields(null, { a: 1 })).toEqual([]);
    expect(changedRowFields({ a: 1 }, 5)).toEqual([]);
    expect(changedRowFields(1, { a: 1 })).toEqual([]);
    expect(changedRowFields({ a: 1 }, null)).toEqual([]);
  });
});

describe("patchTouchedKeys", () => {
  it("diffs updates, marks inserts whole, and removes nothing", () => {
    expect(
      patchTouchedKeys({
        type: "update",
        id: "r",
        prev: { a: 1 },
        next: { a: 2 },
        index: 0,
      })
    ).toEqual(["a"]);
    expect(
      patchTouchedKeys({ type: "insert", id: "r", row: {}, index: 0 })
    ).toBeNull();
    expect(
      patchTouchedKeys({ type: "remove", id: "r", row: {}, index: 0 })
    ).toEqual([]);
  });
});

describe("createChangedCellFlashStore", () => {
  const update = (id: string, prev: object, next: object) => ({
    type: "update" as const,
    id,
    prev,
    next,
    index: 0,
  });

  it("takes nothing while not live, or from an empty burst", () => {
    const store = createChangedCellFlashStore({
      live: false,
      durationMs: CHANGED_CELL_FLASH_MS,
    });
    store.mark([update("r", { a: 1 }, { a: 2 })]);
    expect(store.getSnapshot()).toBe(0);
    store.configure({ live: true, durationMs: 100 });
    store.mark([]);
    expect(store.getSnapshot()).toBe(0);
  });

  it("marks the changed cells and forgets them on the row's clock", () => {
    const store = createChangedCellFlashStore({ live: true, durationMs: 100 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.mark([
      update("r", { a: 1, b: 1 }, { a: 2, b: 1 }),
      update("s", { a: 1 }, { a: 1 }),
      { type: "remove", id: "t", row: {}, index: 0 },
    ]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.isFlashing("r", "a")).toBe(true);
    expect(store.isFlashing("r", "b")).toBe(false);
    expect(store.isFlashing("s", "a")).toBe(false);
    expect(store.isRowFlashing("r")).toBe(true);
    expect(store.isRowFlashing("s")).toBe(false);
    vi.advanceTimersByTime(60);
    // A later change to the same row restarts its clock and adds its cells.
    store.mark([update("r", { b: 1 }, { b: 2 })]);
    vi.advanceTimersByTime(60);
    expect(store.isFlashing("r", "a")).toBe(true);
    expect(store.isFlashing("r", "b")).toBe(true);
    vi.advanceTimersByTime(40);
    expect(store.isRowFlashing("r")).toBe(false);
    expect(store.getSnapshot()).toBe(3);
    unsubscribe();
  });

  it("marks an inserted row whole", () => {
    const store = createChangedCellFlashStore({ live: true, durationMs: 100 });
    store.mark([{ type: "insert", id: "n", row: {}, index: 0 }]);
    expect(store.isFlashing("n", "anything")).toBe(true);
    expect(store.isRowFlashing("n")).toBe(true);
  });

  it("reads nothing once it is not live, and clears on demand", () => {
    const store = createChangedCellFlashStore({ live: true, durationMs: 100 });
    store.mark([{ type: "insert", id: "n", row: {}, index: 0 }]);
    store.configure({ live: false, durationMs: 100 });
    expect(store.isFlashing("n", "a")).toBe(false);
    expect(store.isRowFlashing("n")).toBe(false);
    store.configure({ live: true, durationMs: 100 });
    store.clear();
    expect(store.isRowFlashing("n")).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
