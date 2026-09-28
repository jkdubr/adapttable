/**
 * Undo is a replay through the host's own channel, one gesture at a time.
 */
import { describe, expect, it, vi } from "vitest";

import {
  createEditHistory,
  editHistoryView,
  recordingCellEdit,
  resolveEditHistory,
} from "./editHistory";

interface Person {
  id: string;
  name: string;
}

const ADA: Person = { id: "1", name: "Ada" };
const COLUMNS = [{ key: "name" }];

function setup(enabled = true, depth?: number) {
  const onCellEdit = vi.fn();
  const history = createEditHistory<Person>({
    enabled,
    depth,
    columns: COLUMNS,
    onCellEdit,
  });
  const view = () => editHistoryView(history, history.getSnapshot(), enabled);
  return { history, onCellEdit, view };
}

describe("createEditHistory", () => {
  it("records nothing while it is off", () => {
    const { history, view } = setup(false);
    history.record([{ row: ADA, columnKey: "name", value: "Augusta" }]);
    expect(view()).toMatchObject({
      enabled: false,
      canUndo: false,
      canRedo: false,
    });
    expect(history.undo()).toBe(0);
  });

  it("replays the previous value back through the host, then forwards", () => {
    const { history, onCellEdit, view } = setup();
    history.record([{ row: ADA, columnKey: "name", value: "Augusta" }]);
    expect(view().canUndo).toBe(true);
    expect(view().undo()).toBe(1);
    expect(onCellEdit).toHaveBeenLastCalledWith(ADA, "name", "Ada");
    expect(view().canRedo).toBe(true);
    expect(view().redo()).toBe(1);
    expect(onCellEdit).toHaveBeenLastCalledWith(ADA, "name", "Augusta");
    expect(history.redo()).toBe(0);
  });

  it("skips an empty gesture, and a column it cannot read", () => {
    const { history, onCellEdit, view } = setup();
    history.record([]);
    expect(view().canUndo).toBe(false);
    history.record([{ row: ADA, columnKey: "missing", value: 1 }]);
    // The gesture is kept for redo, but nothing is known to put back.
    expect(history.undo()).toBe(0);
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it("forgets the oldest gesture past its depth, and forgets all on clear", () => {
    const { history, view } = setup(true, 1);
    history.record([{ row: ADA, columnKey: "name", value: "B" }]);
    history.record([{ row: ADA, columnKey: "name", value: "C" }]);
    expect(history.undo()).toBe(1);
    expect(view().canUndo).toBe(false);
    view().clear();
    expect(view().canRedo).toBe(false);
  });

  it("reads its options at the moment it acts", () => {
    const { history, onCellEdit } = setup(false);
    history.configure({ enabled: true, columns: COLUMNS, onCellEdit });
    history.record([{ row: ADA, columnKey: "name", value: "B" }]);
    expect(history.undo()).toBe(1);
  });
});

describe("resolveEditHistory", () => {
  it("arms on true or an options object, with the depth it names", () => {
    expect(resolveEditHistory(undefined)).toEqual({
      enabled: false,
      depth: undefined,
    });
    expect(resolveEditHistory(false).enabled).toBe(false);
    expect(resolveEditHistory(true)).toEqual({
      enabled: true,
      depth: undefined,
    });
    expect(resolveEditHistory({ depth: 5 })).toEqual({
      enabled: true,
      depth: 5,
    });
  });
});

describe("recordingCellEdit", () => {
  it("is absent without a channel", () => {
    expect(recordingCellEdit(undefined, vi.fn())).toBeUndefined();
  });

  it("records a one-cell gesture and hands back what the host returned", () => {
    const record = vi.fn();
    const saved = Promise.resolve();
    const channel = recordingCellEdit<Person>(() => saved, record);
    expect(channel?.(ADA, "name", "B")).toBe(saved);
    expect(record).toHaveBeenCalledWith([
      { row: ADA, columnKey: "name", value: "B" },
    ]);
  });
});
