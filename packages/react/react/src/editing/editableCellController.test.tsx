import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "../columnDef";
import { useDirtyCells } from "./dirtyCells";
import {
  editableCellController,
  rowEditingSignature,
  rowIsDirty,
} from "./editableCellController";
import { useCellEditing } from "./useCellEditing";
import { useEditValidation } from "./validation";

interface Person {
  id: string;
  name: string;
  age: number;
}

const ROWS: Person[] = [
  { id: "1", name: "Ada", age: 36 },
  { id: "2", name: "Grace", age: 85 },
];

const COLS: ColumnDef<Person>[] = [
  { key: "name", editable: true },
  { key: "age", editable: true, editor: "number", sortValue: (r) => r.age },
  { key: "id" },
];

describe("editableCellController", () => {
  // The pipeline itself is `@adapttable/core`'s and tested there; this is the
  // binding's column type and bundle reaching it.
  it("runs core's pipeline over React's columns and bundle", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    const controller = () =>
      editableCellController({
        editing: { onCellEdit, state: result.current },
        row: ROWS[0]!,
        column: COLS[0]!,
        rowId: "1",
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
      });
    expect(controller().mode).toBe("activatable");
    act(() => {
      controller().begin();
    });
    expect(controller().mode).toBe("editing");
    act(() => {
      controller().onEditorKeyDown({
        key: "Enter",
        preventDefault: () => undefined,
      });
    });
    expect(onCellEdit).toHaveBeenCalledWith(ROWS[0], "name", "Ada");
  });
});

describe("rowIsDirty", () => {
  it("is false without a dirty tracker and true when that row is dirty", () => {
    expect(rowIsDirty(undefined, "1")).toBe(false);
    const { result } = renderHook(() => {
      const state = useCellEditing();
      const dirty = useDirtyCells({ enabled: true });
      return { state, dirty };
    });
    const onCellEdit = vi.fn();
    expect(rowIsDirty({ onCellEdit, state: result.current.state }, "1")).toBe(
      false
    );
    act(() => {
      result.current.dirty.mark("1", "name");
    });
    const editing = {
      onCellEdit,
      state: result.current.state,
      dirty: result.current.dirty,
    };
    expect(rowIsDirty(editing, "1")).toBe(true);
    expect(rowIsDirty(editing, "2")).toBe(false);
  });
});

describe("rowEditingSignature", () => {
  it("is null when editing is off (opt-out DNA)", () => {
    expect(rowEditingSignature(undefined, "1")).toBeNull();
  });

  it("fingerprints only the active row's draft", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    expect(
      rowEditingSignature({ onCellEdit, state: result.current }, "1")
    ).toBe("");
    act(() => result.current.begin("1", "name", "Ada"));
    // The digest also carries the validation message and the busy flag, so a
    // rejected cell repaints; both are empty while nothing validates it.
    expect(
      rowEditingSignature({ onCellEdit, state: result.current }, "1")
    ).toBe("name:Ada::");
    expect(
      rowEditingSignature({ onCellEdit, state: result.current }, "2")
    ).toBe("");
    act(() => result.current.setDraft("Augusta"));
    expect(
      rowEditingSignature({ onCellEdit, state: result.current }, "1")
    ).toBe("name:Augusta::");
  });

  it("fingerprints a live conflict so the asked row repaints", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    act(() => result.current.begin("1", "name", "Ada"));
    const conflict = {
      current: {
        row: { ...ROWS[0]!, name: "Arrived" },
        previous: ROWS[0]!,
        rowId: "1",
        columnKey: "name",
        unit: "cell" as const,
        draft: "Ada",
        incomingValue: "Arrived",
        previousValue: "Ada",
        changes: [],
      },
      isConflict: (rowId: string, columnKey: string) =>
        rowId === "1" && columnKey === "name",
      isRowConflict: () => false,
      isRowContested: () => false,
      keepCell: () => undefined,
      takeCell: () => undefined,
      contestedCell: () => undefined,
      anyContested: false,
      rowSignature: () => "",
      keep: () => undefined,
      take: () => undefined,
      reconcile: () => undefined,
      reconcileRow: () => undefined,
      reconcileBatch: () => undefined,
      clear: () => undefined,
    };
    expect(
      rowEditingSignature({ onCellEdit, state: result.current, conflict }, "1")
    ).toBe("name:Ada::conflict:name:Arrived");
    expect(
      rowEditingSignature({ onCellEdit, state: result.current, conflict }, "2")
    ).toBe("");
  });
});

/**
 * The paths a cell leaves an edit by, other than Enter: Tab (commit and open
 * the next cell), Escape (throw the draft away), and a click somewhere else.
 * Each of the three has to reach the host exactly once — or not at all.
 */
describe("rowEditingSignature — with validation", () => {
  it("changes for a row marked by a rule it is not editing", async () => {
    // A cross-field rule marks a cell in a row that holds no open editor. That
    // row still has to repaint, or the message it was given paints nothing.
    const onCellEdit = vi.fn();
    const { result } = renderHook(() => ({
      state: useCellEditing(),
      validation: useEditValidation<Person>(),
    }));
    const editing = {
      onCellEdit,
      state: result.current.state,
      validation: result.current.validation,
    };
    expect(rowEditingSignature(editing, "2")).toBe("");

    await act(async () => {
      await result.current.validation.check({
        target: { rowId: "2", columnKey: "age" },
        value: 1,
        row: ROWS[1]!,
        validateCell: () => "too young",
      });
    });
    expect(
      rowEditingSignature(
        { ...editing, validation: result.current.validation },
        "2"
      )
    ).toBe("invalid");
  });

  it("carries the message and the busy flag for the row being edited", async () => {
    const onCellEdit = vi.fn();
    const { result } = renderHook(() => ({
      state: useCellEditing(),
      validation: useEditValidation<Person>(),
    }));
    act(() => {
      result.current.state.begin("1", "name", "Ada");
    });
    await act(async () => {
      await result.current.validation.check({
        target: { rowId: "1", columnKey: "name" },
        value: "",
        row: ROWS[0]!,
        validateCell: () => "required",
      });
    });
    expect(
      rowEditingSignature(
        {
          onCellEdit,
          state: result.current.state,
          validation: result.current.validation,
        },
        "1"
      )
    ).toBe("name:Ada:required:");
  });
});
