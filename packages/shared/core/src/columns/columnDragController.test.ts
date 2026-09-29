import { describe, expect, it, vi } from "vitest";

import {
  acceptColumnDrag,
  COLUMN_DND_MIME,
  type ColumnDataTransfer,
  type ColumnDragEvent,
  columnReorderKeyDown,
  createColumnDragController,
  dropColumn,
  startColumnDrag,
} from "./columnReorderModel";

function transfer(data: Record<string, string> = {}): ColumnDataTransfer {
  return {
    get types() {
      return Object.keys(data);
    },
    setData: (format, value) => {
      data[format] = value;
    },
    getData: (format) => data[format] ?? "",
    effectAllowed: "none",
    dropEffect: "none",
  };
}

function dragEvent(
  dataTransfer: ColumnDataTransfer | null,
  target: EventTarget | null = null
): ColumnDragEvent {
  const event = {
    target,
    dataTransfer,
    defaultPrevented: false,
    preventDefault: () => {
      event.defaultPrevented = true;
    },
  };
  return event;
}

const control = { closest: (s: string) => (s.includes("button") ? {} : null) };

describe("column drag handlers", () => {
  it("puts the column key on a drag from the row body", () => {
    const data = transfer();
    startColumnDrag(dragEvent(data), "name");
    expect(data.getData(COLUMN_DND_MIME)).toBe("name");
    expect(data.effectAllowed).toBe("move");
  });

  it("refuses a drag that starts on a control inside the row", () => {
    const event = dragEvent(transfer(), control as unknown as EventTarget);
    startColumnDrag(event, "name");
    expect(event.defaultPrevented).toBe(true);
  });

  it("ignores a drag event without data", () => {
    const event = dragEvent(null);
    startColumnDrag(event, "name");
    acceptColumnDrag(event);
    dropColumn(event, 1, () => undefined);
    expect(event.defaultPrevented).toBe(false);
  });

  it("accepts only a column drag", () => {
    const other = dragEvent(transfer({ "text/plain": "x" }));
    acceptColumnDrag(other);
    expect(other.defaultPrevented).toBe(false);
    const data = transfer({ [COLUMN_DND_MIME]: "name" });
    const column = dragEvent(data);
    acceptColumnDrag(column);
    expect(column.defaultPrevented).toBe(true);
    expect(data.dropEffect).toBe("move");
  });

  it("moves the dropped column, and nothing when the drag carries none", () => {
    const move = vi.fn();
    dropColumn(dragEvent(transfer({ [COLUMN_DND_MIME]: "name" })), 2, move);
    expect(move).toHaveBeenCalledWith("name", 2);
    dropColumn(dragEvent(transfer()), 2, move);
    expect(move).toHaveBeenCalledTimes(1);
  });

  it("steps a column with the arrow keys, flipping in RTL", () => {
    const move = vi.fn();
    const key = (k: string) => ({
      key: k,
      currentTarget: null,
      preventDefault: vi.fn(),
    });
    columnReorderKeyDown(key("ArrowLeft"), "name", 2, move, () => false);
    columnReorderKeyDown(key("ArrowLeft"), "name", 2, move, () => true);
    const other = key("Enter");
    columnReorderKeyDown(other, "name", 2, move, () => false);
    expect(move.mock.calls).toEqual([
      ["name", 1],
      ["name", 3],
    ]);
    expect(other.preventDefault).not.toHaveBeenCalled();
  });
});

describe("createColumnDragController", () => {
  it("tracks a drag from start to drop and notifies once per change", () => {
    const controller = createColumnDragController();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    const data = transfer();

    controller.dragStart(dragEvent(data), "age", 3);
    expect(controller.getSnapshot().drag).toEqual({ key: "age", from: 3 });
    expect(controller.rowAttrs("age", 3)).toEqual({ "data-dragging": "" });

    controller.dragOver(dragEvent(data), 1);
    controller.dragOver(dragEvent(data), 1);
    expect(controller.getSnapshot().overIndex).toBe(1);
    expect(controller.rowAttrs("name", 1)).toEqual({ "data-drop": "before" });
    expect(listener).toHaveBeenCalledTimes(2);

    const move = vi.fn();
    controller.drop(dragEvent(data), 1, move);
    expect(move).toHaveBeenCalledWith("age", 1);
    expect(controller.getSnapshot()).toEqual({ drag: null, overIndex: null });

    unsubscribe();
    controller.dragStart(dragEvent(transfer()), "age", 0);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("does not start a refused drag, or hover a foreign one", () => {
    const controller = createColumnDragController();
    controller.dragStart(
      dragEvent(transfer(), control as unknown as EventTarget),
      "age",
      0
    );
    controller.dragOver(dragEvent(transfer({ "text/plain": "x" })), 2);
    expect(controller.getSnapshot()).toEqual({ drag: null, overIndex: null });
    controller.end();
    expect(controller.rowAttrs("age", 0)).toEqual({});
  });
});
