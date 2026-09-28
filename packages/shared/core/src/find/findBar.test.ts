/**
 * The find bar's shared behavior: its keys, its count text, the Ctrl/Cmd+F
 * scope, and bringing the current match into view.
 */
import { describe, expect, it, vi } from "vitest";

import {
  createFindShortcutScope,
  defaultFindMatchCount,
  FIND_CURRENT_MATCH_SELECTOR,
  findMatchCountText,
  findMatchRow,
  handleFindBarKey,
  isFindShortcut,
  scrollCurrentMatchIntoView,
} from "./findBar";

const chord = (
  key: string,
  mods: Partial<{
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
  }> = {}
) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe("find count text", () => {
  it("reads the walk from one, or no matches", () => {
    expect(defaultFindMatchCount(3, 17)).toBe("3 of 17");
    expect(defaultFindMatchCount(0, 0)).toBe("No matches");
    expect(findMatchCountText(undefined, 2, 5)).toBe("3 of 5");
  });

  it("goes through the host's label when it gave one", () => {
    const findMatchCount = vi.fn((c: number, t: number) => `${c}/${t}`);
    expect(findMatchCountText({ findMatchCount }, -1, 0)).toBe("0/0");
  });
});

describe("handleFindBarKey", () => {
  const target = () => ({
    setOpen: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
  });
  const event = (key: string, shiftKey = false) => ({
    key,
    shiftKey,
    preventDefault: vi.fn(),
  });

  it("closes on Escape without preventing it", () => {
    const find = target();
    const key = event("Escape");
    expect(handleFindBarKey(key, find)).toBe(true);
    expect(find.setOpen).toHaveBeenCalledWith(false);
    expect(key.preventDefault).not.toHaveBeenCalled();
  });

  it("walks forward on Enter and back on Shift+Enter", () => {
    const find = target();
    const enter = event("Enter");
    handleFindBarKey(enter, find);
    handleFindBarKey(event("Enter", true), find);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(find.next).toHaveBeenCalledTimes(1);
    expect(find.previous).toHaveBeenCalledTimes(1);
  });

  it("leaves every other key alone", () => {
    const find = target();
    const key = event("a");
    expect(handleFindBarKey(key, find)).toBe(false);
    expect(key.preventDefault).not.toHaveBeenCalled();
  });
});

describe("isFindShortcut", () => {
  it("is Ctrl or Cmd with F and nothing else", () => {
    expect(isFindShortcut(chord("f", { ctrlKey: true }))).toBe(true);
    expect(isFindShortcut(chord("F", { metaKey: true }))).toBe(true);
    expect(isFindShortcut(chord("f"))).toBe(false);
    expect(isFindShortcut(chord("g", { ctrlKey: true }))).toBe(false);
    expect(isFindShortcut(chord("f", { ctrlKey: true, altKey: true }))).toBe(
      false
    );
    expect(isFindShortcut(chord("f", { ctrlKey: true, shiftKey: true }))).toBe(
      false
    );
  });
});

describe("createFindShortcutScope", () => {
  const setup = () => {
    const openBar = vi.fn();
    const scope = createFindShortcutScope({
      contains: (target) => target === "inside",
      openBar,
    });
    const press = (target: unknown, key = "f") => {
      const event = {
        ...chord(key, { ctrlKey: true }),
        target,
        preventDefault: vi.fn(),
      };
      scope.keyDown(event);
      return event;
    };
    return { scope, openBar, press };
  };

  it("opens from a key inside the table", () => {
    const { openBar, press } = setup();
    expect(press("inside").preventDefault).toHaveBeenCalled();
    expect(openBar).toHaveBeenCalledTimes(1);
  });

  it("leaves the browser's find alone outside it", () => {
    const { openBar, press } = setup();
    expect(press("outside").preventDefault).not.toHaveBeenCalled();
    expect(openBar).not.toHaveBeenCalled();
  });

  it("ignores other keys inside", () => {
    const { openBar, press } = setup();
    press("inside", "g");
    expect(openBar).not.toHaveBeenCalled();
  });

  it("counts a press inside until focus moves elsewhere", () => {
    const { scope, openBar, press } = setup();
    scope.pointerDown("inside");
    press("body");
    expect(openBar).toHaveBeenCalledTimes(1);
    scope.focusIn("inside");
    press("body");
    expect(openBar).toHaveBeenCalledTimes(2);
    scope.focusIn("outside");
    press("body");
    expect(openBar).toHaveBeenCalledTimes(2);
    scope.pointerDown("inside");
    scope.pointerDown("outside");
    press("body");
    expect(openBar).toHaveBeenCalledTimes(2);
  });
});

describe("scrollCurrentMatchIntoView", () => {
  it("scrolls the marked cell to the nearest edge", () => {
    const root = document.createElement("div");
    const cell = document.createElement("td");
    cell.setAttribute("data-cell-match-current", "");
    const scrollIntoView = vi.fn();
    cell.scrollIntoView = scrollIntoView;
    root.append(cell);
    expect(root.querySelector(FIND_CURRENT_MATCH_SELECTOR)).toBe(cell);
    expect(scrollCurrentMatchIntoView(root)).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
  });

  it("does nothing without a root or a marked cell", () => {
    expect(scrollCurrentMatchIntoView(null)).toBe(false);
    expect(scrollCurrentMatchIntoView(document.createElement("div"))).toBe(
      false
    );
  });

  it("tolerates an element without scrollIntoView", () => {
    const root = document.createElement("div");
    const cell = document.createElement("td");
    cell.setAttribute("data-cell-match-current", "");
    Object.defineProperty(cell, "scrollIntoView", { value: undefined });
    root.append(cell);
    expect(scrollCurrentMatchIntoView(root)).toBe(true);
  });
});

describe("findMatchRow", () => {
  it("maps the match into the loaded window", () => {
    const rows = ["a", "b", "c"];
    expect(findMatchRow(rows, 10, { row: 11, col: 0 })).toBe("b");
    expect(findMatchRow(rows, undefined, { row: 2, col: 0 })).toBe("c");
    expect(findMatchRow(rows, 0, { row: 9, col: 0 })).toBeUndefined();
    expect(findMatchRow(rows, 0, null)).toBeUndefined();
  });
});
