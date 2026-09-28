/**
 * The shortcut parser and matcher: one chord right on both platforms, a bare
 * key that stays quiet while someone types, and a list the host replaces.
 */
import { describe, expect, it, vi } from "vitest";

import {
  chordHasCommandModifier,
  chordMatches,
  createShortcutHandler,
  DEFAULT_SHORTCUTS,
  isTextEntryTarget,
  parseChord,
} from "./shortcuts";

const key = (
  value: string,
  mods: Partial<{
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
  }> = {},
  target: unknown = null
) => ({
  key: value,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  target,
  preventDefault: vi.fn(),
  ...mods,
});

describe("parseChord", () => {
  it("reads the key and each modifier", () => {
    expect(parseChord("Mod+Shift+K")).toEqual({
      key: "k",
      mod: true,
      ctrl: false,
      meta: false,
      alt: false,
      shift: true,
    });
    expect(parseChord("ctrl+meta+alt+x")).toMatchObject({
      ctrl: true,
      meta: true,
      alt: true,
    });
    expect(parseChord("").key).toBe("");
  });

  it("defaults to mod+k for the palette", () => {
    expect(DEFAULT_SHORTCUTS).toEqual([
      { chord: "mod+k", command: "command-palette" },
    ]);
  });
});

describe("chordMatches", () => {
  it("takes either modifier for mod", () => {
    const chord = parseChord("mod+k");
    expect(chordHasCommandModifier(chord)).toBe(true);
    expect(chordMatches(chord, key("K", { ctrlKey: true }))).toBe(true);
    expect(chordMatches(chord, key("k", { metaKey: true }))).toBe(true);
    expect(chordMatches(chord, key("k"))).toBe(false);
    expect(chordMatches(chord, key("j", { ctrlKey: true }))).toBe(false);
  });

  it("requires ctrl and meta specifically when named", () => {
    expect(
      chordMatches(parseChord("ctrl+p"), key("p", { metaKey: true }))
    ).toBe(false);
    expect(
      chordMatches(parseChord("meta+p"), key("p", { ctrlKey: true }))
    ).toBe(false);
    expect(
      chordMatches(parseChord("meta+p"), key("p", { metaKey: true }))
    ).toBe(true);
  });

  it("rejects extra or missing alt and shift", () => {
    const chord = parseChord("mod+k");
    expect(chordMatches(chord, key("k", { ctrlKey: true, altKey: true }))).toBe(
      false
    );
    expect(
      chordMatches(chord, key("k", { ctrlKey: true, shiftKey: true }))
    ).toBe(false);
  });

  it("keeps a bare key quiet while a command modifier is held", () => {
    const chord = parseChord("e");
    expect(chordHasCommandModifier(chord)).toBe(false);
    expect(chordMatches(chord, key("e"))).toBe(true);
    expect(chordMatches(chord, key("e", { ctrlKey: true }))).toBe(false);
  });
});

describe("isTextEntryTarget", () => {
  it("knows inputs, text areas, selects and editable content", () => {
    expect(isTextEntryTarget(document.createElement("input"))).toBe(true);
    expect(isTextEntryTarget(document.createElement("textarea"))).toBe(true);
    expect(isTextEntryTarget(document.createElement("select"))).toBe(true);
    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(isTextEntryTarget(editable)).toBe(true);
    expect(isTextEntryTarget(document.createElement("span"))).toBe(false);
    expect(isTextEntryTarget(null)).toBe(false);
  });

  it("is false where there is no DOM", () => {
    vi.stubGlobal("HTMLElement", undefined);
    try {
      expect(isTextEntryTarget({ tagName: "INPUT" })).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("createShortcutHandler", () => {
  it("runs the first match and prevents the key", () => {
    const onCommand = vi.fn();
    const handle = createShortcutHandler(DEFAULT_SHORTCUTS, onCommand);
    const event = key("k", { ctrlKey: true });
    expect(handle(event)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(onCommand).toHaveBeenCalledWith("command-palette");
  });

  it("returns false and leaves the key when nothing matches", () => {
    const onCommand = vi.fn();
    const handle = createShortcutHandler(DEFAULT_SHORTCUTS, onCommand);
    const event = key("j", { ctrlKey: true });
    expect(handle(event)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onCommand).not.toHaveBeenCalled();
  });

  it("skips a bare key typed into a text entry, but not a chord", () => {
    const onCommand = vi.fn();
    const handle = createShortcutHandler(
      [
        { chord: "e", command: "edit" },
        { chord: "mod+e", command: "export" },
      ],
      onCommand
    );
    const input = document.createElement("input");
    expect(handle(key("e", {}, input))).toBe(false);
    expect(handle(key("e", { metaKey: true }, input))).toBe(true);
    expect(handle(key("e", {}, document.createElement("span")))).toBe(true);
    expect(onCommand.mock.calls).toEqual([["export"], ["edit"]]);
  });
});
