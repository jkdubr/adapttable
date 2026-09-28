import { describe, expect, it, vi } from "vitest";

import { createColumnRenameEditor } from "./columnRenameEditor";

function setup() {
  const onRename = vi.fn();
  const editor = createColumnRenameEditor({
    key: "a",
    name: "Alpha",
    onRename,
    requiredMessage: "Required",
    renamedMessage: ({ previous, name }) => `${previous} → ${name}`,
  });
  const listener = vi.fn();
  const unsubscribe = editor.subscribe(listener);
  return { editor, onRename, listener, unsubscribe };
}

describe("createColumnRenameEditor", () => {
  it("opens seeded from the current name", () => {
    const { editor, listener, unsubscribe } = setup();
    expect(editor.getSnapshot()).toEqual({
      editing: false,
      draft: "Alpha",
      announcement: "",
    });
    editor.begin();
    expect(editor.getSnapshot().editing).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    editor.setDraft("x");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("shows the required error on a blank blur or submit, and clears it once corrected", () => {
    const { editor } = setup();
    editor.begin();
    editor.blur();
    expect(editor.getSnapshot().error).toBeUndefined();
    editor.setDraft("  ");
    editor.blur();
    expect(editor.getSnapshot().error).toBe("Required");
    editor.setDraft(" ");
    expect(editor.getSnapshot().error).toBe("Required");
    expect(editor.submit()).toBe("invalid");
    expect(editor.getSnapshot().editing).toBe(true);
    editor.setDraft("B");
    expect(editor.getSnapshot().error).toBeUndefined();
  });

  it("closes without renaming when the name is unchanged", () => {
    const { editor, onRename } = setup();
    editor.begin();
    editor.setDraft(" Alpha ");
    expect(editor.submit()).toBe("unchanged");
    expect(editor.getSnapshot().editing).toBe(false);
    expect(onRename).not.toHaveBeenCalled();
  });

  it("renames, announces and closes", () => {
    const { editor, onRename } = setup();
    editor.begin();
    editor.setDraft(" Beta ");
    expect(editor.submit()).toBe("renamed");
    expect(onRename).toHaveBeenCalledWith("a", "Beta");
    expect(editor.getSnapshot()).toMatchObject({
      editing: false,
      announcement: "Alpha → Beta",
    });
  });

  it("discards the draft on cancel, reading the name configured last", () => {
    const { editor, onRename } = setup();
    editor.configure({
      key: "a",
      name: "Gamma",
      onRename,
      requiredMessage: "Required",
      renamedMessage: () => "",
    });
    editor.begin();
    editor.setDraft("Draft");
    editor.cancel();
    expect(editor.getSnapshot()).toMatchObject({
      editing: false,
      draft: "Gamma",
    });
  });
});
