/**
 * The sticky toolbar rule and the density resolution.
 */
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DENSITY,
  requestDensityChange,
  resolveDensity,
} from "./density";
import {
  measuredToolbarHeight,
  resolveStickyToolbar,
  stickyHeaderOffset,
  stickyToolbarStyle,
} from "./stickyToolbar";

describe("resolveStickyToolbar", () => {
  it("follows the header unless the host chose, and never in a scroll box", () => {
    expect(resolveStickyToolbar()).toBe(false);
    expect(resolveStickyToolbar(true)).toBe(true);
    expect(resolveStickyToolbar(true, false)).toBe(false);
    expect(resolveStickyToolbar(false, true)).toBe(true);
    expect(resolveStickyToolbar(true, true, true)).toBe(false);
  });
});

describe("sticky toolbar layout", () => {
  it("parks the toolbar and pushes the header below it", () => {
    expect(stickyToolbarStyle(false)).toBeUndefined();
    expect(stickyToolbarStyle(true)).toEqual({
      position: "sticky",
      top: 0,
      zIndex: 3,
      background: "var(--adapttable-surface, Canvas)",
    });
    expect(stickyToolbarStyle(true, 12)?.top).toBe(12);
    expect(stickyHeaderOffset(true, 12, 40)).toBe(52);
    expect(stickyHeaderOffset(false, 12, 40)).toBe(12);
  });

  it("rounds the measured height up", () => {
    const element = {
      getBoundingClientRect: () => ({ height: 39.2 }) as DOMRect,
    };
    expect(measuredToolbarHeight(element)).toBe(40);
  });
});

describe("density", () => {
  it("prefers the controlled value, then the chooser's, then comfortable", () => {
    expect(DEFAULT_DENSITY).toBe("comfortable");
    expect(resolveDensity("compact", "comfortable")).toBe("compact");
    expect(resolveDensity(undefined, "compact")).toBe("compact");
    expect(resolveDensity(undefined, undefined)).toBe("comfortable");
  });

  it("updates the chooser only while uncontrolled and always notifies", () => {
    const setFeatureDensity = vi.fn();
    const onDensityChange = vi.fn();
    requestDensityChange("compact", {
      controlled: true,
      setFeatureDensity,
      onDensityChange,
    });
    expect(setFeatureDensity).not.toHaveBeenCalled();
    expect(onDensityChange).toHaveBeenCalledWith("compact");
    requestDensityChange("comfortable", {
      controlled: false,
      setFeatureDensity,
      onDensityChange,
    });
    expect(setFeatureDensity).toHaveBeenCalledWith("comfortable");
    expect(() => {
      requestDensityChange("compact", { controlled: false });
    }).not.toThrow();
  });
});
