/**
 * The saved-views panel's row controls and inline rename.
 */
import { describe, expect, it, vi } from "vitest";

import { resolveLabels } from "../labels";
import {
  createSavedViewRenameController,
  SAVED_VIEW_GLYPH_PATHS,
  savedViewRowControls,
  type SavedViewRowControlsInput,
} from "./savedViewsPanelModel";

const labels = resolveLabels(undefined);

function input(
  overrides: Partial<SavedViewRowControlsInput> = {}
): SavedViewRowControlsInput {
  return {
    view: { name: "Open", search: "" },
    index: 1,
    count: 3,
    editing: false,
    labels,
    onStartRename: vi.fn(),
    onMove: vi.fn(),
    onSetDefault: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
}

describe("savedViewRowControls", () => {
  it("lists the cluster in order with labels and glyphs", () => {
    const controls = savedViewRowControls(input());
    expect(controls.map((control) => control.key)).toEqual([
      "rename",
      "moveUp",
      "moveDown",
      "default",
      "remove",
    ]);
    expect(controls.map((control) => control.label)).toEqual([
      labels.renameView,
      labels.moveViewUp,
      labels.moveViewDown,
      labels.setDefaultView,
      labels.deleteView,
    ]);
    expect(controls[0]?.glyph).toEqual({
      paths: SAVED_VIEW_GLYPH_PATHS.rename,
      filled: false,
    });
    expect(controls[3]?.pressed).toBe(false);
    expect(controls[4]?.danger).toBe(true);
    expect("pressed" in (controls[0] ?? {})).toBe(false);
  });

  it("runs each handler", () => {
    const row = input();
    const controls = savedViewRowControls(row);
    for (const control of controls) control.onPress?.();
    expect(row.onStartRename).toHaveBeenCalledTimes(1);
    expect(row.onMove).toHaveBeenNthCalledWith(1, -1);
    expect(row.onMove).toHaveBeenNthCalledWith(2, 1);
    expect(row.onSetDefault).toHaveBeenCalledTimes(1);
    expect(row.onRemove).toHaveBeenCalledTimes(1);
  });

  it("disables moves off either end and rename while editing", () => {
    const first = savedViewRowControls(input({ index: 0, editing: true }));
    expect(first[0]?.onPress).toBeUndefined();
    expect(first[1]?.onPress).toBeUndefined();
    expect(first[2]?.onPress).toBeDefined();
    const last = savedViewRowControls(input({ index: 2 }));
    expect(last[2]?.onPress).toBeUndefined();
  });

  it("fills the star on the default view", () => {
    const controls = savedViewRowControls(
      input({ view: { name: "Open", search: "", isDefault: true } })
    );
    expect(controls[3]?.pressed).toBe(true);
    expect(controls[3]?.glyph.filled).toBe(true);
  });

  it("offers nothing on a view this reader may not change", () => {
    const controls = savedViewRowControls(
      input({ view: { name: "Team", search: "", readOnly: true } })
    );
    expect(controls.every((control) => control.onPress === undefined)).toBe(
      true
    );
  });
});

describe("createSavedViewRenameController", () => {
  it("edits, commits and stops", () => {
    const rename = createSavedViewRenameController();
    const listener = vi.fn();
    const unsubscribe = rename.subscribe(listener);
    rename.begin("Open");
    expect(rename.getSnapshot()).toEqual({ editing: "Open", draft: "Open" });
    rename.setDraft("Closed");
    rename.setDraft("Closed");
    const onRename = vi.fn();
    rename.commit(onRename);
    expect(onRename).toHaveBeenCalledWith("Open", "Closed");
    expect(rename.getSnapshot().editing).toBeNull();
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it("commits nothing when not editing, and cancels without renaming", () => {
    const rename = createSavedViewRenameController();
    const onRename = vi.fn();
    rename.commit(onRename);
    expect(onRename).not.toHaveBeenCalled();
    rename.begin("Open");
    rename.cancel();
    expect(rename.getSnapshot()).toEqual({ editing: null, draft: "Open" });
  });
});
