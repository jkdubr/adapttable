/**
 * The "select all matching" scope: taken only when the source can reach past
 * the page, narrowed by any explicit change.
 */
import { describe, expect, it, vi } from "vitest";

import { createAllMatchingScope } from "./allMatchingScope";

describe("createAllMatchingScope", () => {
  it("starts narrowed and widens only when the source can answer", () => {
    const scope = createAllMatchingScope();
    const listener = vi.fn();
    const unsubscribe = scope.subscribe(listener);
    expect(scope.getSnapshot()).toBe(false);
    expect(scope.select(false)).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(scope.select(true)).toBe(true);
    expect(scope.select(true)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("narrows back on any explicit change", () => {
    const scope = createAllMatchingScope();
    scope.select(true);
    scope.narrow();
    expect(scope.getSnapshot()).toBe(false);
    scope.narrow();
    expect(scope.getSnapshot()).toBe(false);
  });
});
