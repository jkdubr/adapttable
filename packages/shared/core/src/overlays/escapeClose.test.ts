/**
 * The Escape-close rule: close unless a showing control inside owns the key.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { isElementShowing, shouldEscapeClose } from "./escapeClose";

afterEach(() => {
  document.body.innerHTML = "";
});

function editor() {
  const overlay = document.createElement("div");
  const owner = document.createElement("div");
  owner.className = "rename";
  const input = document.createElement("input");
  owner.append(input);
  overlay.append(owner);
  document.body.append(overlay);
  return { overlay, owner, input };
}

describe("isElementShowing", () => {
  it("is false for a detached element", () => {
    expect(isElementShowing(document.createElement("div"))).toBe(false);
  });

  it("asks the element and every ancestor", () => {
    const { overlay, owner } = editor();
    expect(isElementShowing(owner)).toBe(true);
    overlay.style.display = "none";
    expect(isElementShowing(owner)).toBe(false);
    overlay.style.display = "";
    owner.style.visibility = "hidden";
    expect(isElementShowing(owner)).toBe(false);
  });
});

describe("shouldEscapeClose", () => {
  it("ignores other keys", () => {
    expect(shouldEscapeClose({ key: "Enter", target: null })).toBe(false);
  });

  it("closes when nothing inside owns the key", () => {
    const { input } = editor();
    expect(shouldEscapeClose({ key: "Escape", target: input })).toBe(true);
    expect(shouldEscapeClose({ key: "Escape", target: null }, ".rename")).toBe(
      true
    );
    expect(
      shouldEscapeClose({ key: "Escape", target: document.body }, ".rename")
    ).toBe(true);
  });

  it("leaves the key to a showing control that owns it", () => {
    const { owner, input } = editor();
    expect(shouldEscapeClose({ key: "Escape", target: input }, ".rename")).toBe(
      false
    );
    owner.style.display = "none";
    expect(shouldEscapeClose({ key: "Escape", target: input }, ".rename")).toBe(
      true
    );
  });

  it("closes where there is no DOM", () => {
    vi.stubGlobal("Element", undefined);
    try {
      expect(shouldEscapeClose({ key: "Escape", target: {} }, ".rename")).toBe(
        true
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
