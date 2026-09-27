/**
 * The highlight store: marks keyed by row and cell, one clock per mark, and
 * a longer steady mark under reduced motion.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createHighlightStore,
  HIGHLIGHT_FADE_MS,
  HIGHLIGHT_STEADY_MS,
  highlightCellKey,
  highlightDuration,
} from "./highlightStore";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("highlightDuration", () => {
  it("holds a steady mark longer", () => {
    expect(highlightDuration(false)).toBe(HIGHLIGHT_FADE_MS);
    expect(highlightDuration(true)).toBe(HIGHLIGHT_STEADY_MS);
    expect(highlightCellKey("r1", "name")).toBe("r1 name");
  });
});

describe("createHighlightStore", () => {
  it("ignores every flash while disabled", () => {
    const store = createHighlightStore({ enabled: false, durationMs: 100 });
    store.flashRow("a");
    store.flashCell({ rowId: "a", columnKey: "x" });
    expect(store.getSnapshot().rows.size).toBe(0);
    expect(store.getSnapshot().cells.size).toBe(0);
  });

  it("marks a row and clears it after the duration", () => {
    const store = createHighlightStore({ enabled: true, durationMs: 100 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.flashRow("a");
    expect(store.getSnapshot().rows.has("a")).toBe(true);
    vi.advanceTimersByTime(60);
    // A repeat restarts the clock rather than stacking.
    store.flashRow("a");
    vi.advanceTimersByTime(60);
    expect(store.getSnapshot().rows.has("a")).toBe(true);
    vi.advanceTimersByTime(40);
    expect(store.getSnapshot().rows.has("a")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it("marks a cell on its own clock", () => {
    const store = createHighlightStore({ enabled: true, durationMs: 100 });
    store.flashCell({ rowId: "a", columnKey: "x" });
    store.configure({ enabled: true, durationMs: 300 });
    store.flashRow("b");
    vi.advanceTimersByTime(100);
    expect(store.getSnapshot().cells.has(highlightCellKey("a", "x"))).toBe(
      false
    );
    expect(store.getSnapshot().rows.has("b")).toBe(true);
    vi.advanceTimersByTime(200);
    expect(store.getSnapshot().rows.has("b")).toBe(false);
  });

  it("clears every mark and clock at once", () => {
    const store = createHighlightStore({ enabled: true, durationMs: 100 });
    store.flashRow("a");
    store.flashCell({ rowId: "a", columnKey: "x" });
    store.clear();
    expect(store.getSnapshot().rows.size).toBe(0);
    expect(store.getSnapshot().cells.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops the clocks on dispose without dropping the marks", () => {
    const store = createHighlightStore({ enabled: true, durationMs: 100 });
    store.flashRow("a");
    store.dispose();
    vi.advanceTimersByTime(500);
    expect(store.getSnapshot().rows.has("a")).toBe(true);
  });
});
