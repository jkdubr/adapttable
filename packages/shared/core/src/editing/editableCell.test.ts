/**
 * One editable cell's pipeline: activation, the keys that leave an edit,
 * validation that gates the commit, and the save it watches.
 */
import { describe, expect, it, vi } from "vitest";

import type { EditableColumnLike } from "./cellEditing";
import {
  beginCellEdit,
  type CellEditingState,
  cellEditingView,
  cellSaveView,
  editableCellController,
  editValidationView,
  focusEditorOnMount,
  stopCellEditKeyboard,
} from "./editableCell";
import type { EditLifecycle, RowValidator } from "./editContracts";
import {
  createCellEditSession,
  createCellSaveStore,
  createEditValidationStore,
} from "./editingController";

/** A column, as the controller reads it. */
type ColumnDef<TRow> = EditableColumnLike<TRow>;

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

/** A store read the way a binding reads it: a fresh view on every read. */
interface Live<T> {
  readonly current: T;
}

function live<T>(read: () => T): Live<T> {
  return {
    get current() {
      return read();
    },
  };
}

function cellEditing(): Live<CellEditingState> {
  const session = createCellEditSession();
  return live(() => cellEditingView(session, session.getSnapshot()));
}

function editValidation<TRow>(
  options: { validateRow?: RowValidator<TRow> } = {}
) {
  const store = createEditValidationStore<TRow>(options);
  return live(() =>
    editValidationView(
      store,
      store.getSnapshot(),
      options.validateRow !== undefined
    )
  );
}

function cellSave<TRow>(
  options: { onRollback?: (previous: TRow, columnKey: string) => void } = {}
) {
  const store = createCellSaveStore<TRow>(options);
  return live(() =>
    cellSaveView(store, store.getSnapshot(), options.onRollback !== undefined)
  );
}

/** Several stores read together, as one bundle. */
function mount<T extends Record<string, Live<unknown>>>(
  parts: T
): { result: Live<{ [K in keyof T]: T[K]["current"] }> } {
  return {
    result: live(
      () =>
        Object.fromEntries(
          Object.entries(parts).map(([key, part]) => [key, part.current])
        ) as { [K in keyof T]: T[K]["current"] }
    ),
  };
}

/**
 * Run a gesture. The stores settle synchronously; an async gesture also lets
 * the validators' pending promises run, the way a binding's next frame does.
 */
function act(gesture: () => Promise<void>): Promise<void>;
function act(gesture: () => void): void;
function act(gesture: () => unknown): unknown {
  const outcome = gesture();
  if (!(outcome instanceof Promise)) return undefined;
  return outcome.then(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      })
  );
}

describe("editableCellController", () => {
  it("stays display-only when editing is undefined (opt-out)", () => {
    const ctrl = editableCellController({
      editing: undefined,
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    expect(ctrl.mode).toBe("display");
    ctrl.begin();
    expect(ctrl.mode).toBe("display");
  });

  it("answers every control inertly when the cell cannot be edited", () => {
    // An adapter's cell wires the same handlers on every table — a
    // double-click, a blur, the conflict prompt's two buttons. On a cell with
    // no edit channel each has to do nothing rather than be missing.
    const ctrl = editableCellController({
      editing: undefined,
      row: ROWS[0]!,
      column: COLS[2]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });

    expect(ctrl.editor).toBeNull();
    expect(ctrl.isDirty).toBe(false);
    expect(ctrl.canRollback).toBe(false);
    expect(ctrl.validating).toBe(false);
    expect(ctrl.selectOptions).toEqual([]);
    expect(ctrl.draft).toBe("");
    expect(() => {
      ctrl.setDraft("x");
      ctrl.commit();
      ctrl.cancel();
      ctrl.commitOnBlur();
      ctrl.rollback();
      ctrl.dismissFailure();
      ctrl.keepConflict();
      ctrl.takeConflict();
      ctrl.onEditorKeyDown({ key: "Enter" } as never);
    }).not.toThrow();
    expect(ctrl.mode).toBe("display");
  });

  it("is activatable for editable columns when onCellEdit is set", () => {
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    const ctrl = editableCellController({
      editing: { onCellEdit, state: result.current },
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    expect(ctrl.mode).toBe("activatable");
    expect(ctrl.editor).toBe("text");
  });

  it("is display for non-editable columns even with onCellEdit", () => {
    const { result } = { result: cellEditing() };
    const ctrl = editableCellController({
      editing: { onCellEdit: vi.fn(), state: result.current },
      row: ROWS[0]!,
      column: COLS[2]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    expect(ctrl.mode).toBe("display");
  });

  it("enters editing, commits on Enter via onCellEdit", () => {
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    act(() => {
      editableCellController({
        editing: { onCellEdit, state: result.current },
        row: ROWS[0]!,
        column: COLS[0]!,
        rowId: "1",
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
      }).begin();
    });
    const editingCtrl = editableCellController({
      editing: { onCellEdit, state: result.current },
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    expect(editingCtrl.mode).toBe("editing");
    act(() => editingCtrl.setDraft("Augusta"));
    act(() =>
      editingCtrl.onEditorKeyDown({
        key: "Enter",
        preventDefault: () => undefined,
      })
    );
    expect(onCellEdit).toHaveBeenCalledWith(ROWS[0], "name", "Augusta");
    expect(result.current.active).toBeNull();
  });
});

describe("editableCellController — leaving an edit", () => {
  /** A controller for one cell, against a live editing state. */
  const controllerFor = (
    state: CellEditingState,
    onCellEdit: (row: Person, key: string, next: unknown) => void,
    rowIndex = 0,
    colIndex = 0
  ) =>
    editableCellController({
      editing: { onCellEdit, state },
      row: ROWS[rowIndex]!,
      column: COLS[colIndex]!,
      rowId: ROWS[rowIndex]!.id,
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });

  const press = (key: string, shiftKey = false) => ({
    key,
    shiftKey,
    preventDefault: () => undefined,
  });

  it("commits on Tab and opens the next cell in the row", () => {
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      result.current.setDraft("Ada L");
    });
    act(() => {
      controllerFor(result.current, onCellEdit).onEditorKeyDown(press("Tab"));
    });
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "name",
      "Ada L"
    );
    // The edit moved on rather than closing: the next column is now active.
    expect(result.current.isActive("1", "age")).toBe(true);
  });

  it("commits on Shift+Tab and opens the previous cell", () => {
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit, 0, 1).begin();
    });
    act(() => {
      controllerFor(result.current, onCellEdit, 0, 1).onEditorKeyDown(
        press("Tab", true)
      );
    });
    expect(result.current.isActive("1", "name")).toBe(true);
  });

  it("throws the draft away on Escape without telling the host", () => {
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      result.current.setDraft("nope");
    });
    act(() => {
      controllerFor(result.current, onCellEdit).onEditorKeyDown(
        press("Escape")
      );
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.isActive("1", "name")).toBe(false);
  });

  it("ignores keys it has no meaning for", () => {
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      controllerFor(result.current, onCellEdit).onEditorKeyDown(press("a"));
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.isActive("1", "name")).toBe(true);
  });

  it("commits when the reader clicks away", () => {
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      result.current.setDraft("Ada Lovelace");
    });
    act(() => {
      controllerFor(result.current, onCellEdit).commitOnBlur();
    });
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "name",
      "Ada Lovelace"
    );
  });

  it("holds the draft while a live conflict is being asked", () => {
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    const conflict = {
      current: {
        row: { ...ROWS[0]!, name: "Arrived" },
        previous: ROWS[0]!,
        rowId: "1",
        columnKey: "name",
        unit: "cell" as const,
        draft: "typed",
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
      keep: vi.fn(),
      take: vi.fn(),
      reconcile: () => undefined,
      reconcileRow: () => undefined,
      reconcileBatch: () => undefined,
      clear: () => undefined,
    };
    const ctrl = () =>
      editableCellController({
        editing: { onCellEdit, state: result.current, conflict },
        row: ROWS[0]!,
        column: COLS[0]!,
        rowId: "1",
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
      });
    act(() => {
      ctrl().begin();
    });
    act(() => {
      result.current.setDraft("typed");
    });
    act(() => {
      ctrl().commitOnBlur();
      ctrl().onEditorKeyDown({
        key: "Enter",
        preventDefault: () => undefined,
      });
      ctrl().commit();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.isActive("1", "name")).toBe(true);
    act(() => {
      ctrl().keepConflict();
      ctrl().takeConflict();
    });
    expect(conflict.keep).toHaveBeenCalledOnce();
    expect(conflict.take).toHaveBeenCalledOnce();
  });

  it("does nothing on the blur of a cell that was not the open one", () => {
    // Every cell wires `commitOnBlur`; only the active one may commit, or a
    // click-away would write through every cell in the row.
    const { result } = { result: cellEditing() };
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      controllerFor(result.current, onCellEdit, 1).commitOnBlur();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it("has inert actions when the host never opted in", () => {
    // The display-only controller is handed to every cell of a table with no
    // `onCellEdit`; calling its actions must be safe.
    const ctrl = editableCellController({
      editing: undefined,
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    ctrl.setDraft("x");
    ctrl.onEditorKeyDown(press("Enter"));
    ctrl.commitOnBlur();
    expect(ctrl.draft).toBe("");
    expect(ctrl.mode).toBe("display");
  });
});

/**
 * The validated commit path.
 *
 * The controller's job here is narrow: run the check, keep the reader in the
 * editor while it runs, and let nothing through that the validators rejected.
 */
describe("editableCellController — validation", () => {
  /** A controller over live editing state and live validation state. */
  const setup = (options?: {
    validate?: (
      value: unknown
    ) => string | undefined | Promise<string | undefined>;
    validateRow?: (row: Person) => string | Record<string, string> | undefined;
    lifecycle?: EditLifecycle<Person>;
  }) => {
    const onCellEdit = vi.fn();
    const columns: ColumnDef<Person>[] = [
      { key: "name", editable: true, validate: options?.validate },
      { key: "age", editable: true, editor: "number" },
    ];
    const { result } = mount({
      state: cellEditing(),
      validation: editValidation<Person>({
        validateRow: options?.validateRow,
      }),
    });
    const controller = () =>
      editableCellController({
        editing: {
          onCellEdit,
          state: result.current.state,
          validation: result.current.validation,
          lifecycle: options?.lifecycle,
        },
        row: ROWS[0]!,
        column: columns[0]!,
        rowId: "1",
        rows: ROWS,
        columns,
        rowKey: (r) => r.id,
      });
    return { onCellEdit, result, controller };
  };
  const enter = { key: "Enter", preventDefault: () => undefined };

  it("keeps a rejected value from the host and marks the cell", async () => {
    const { onCellEdit, result, controller } = setup({
      validate: (value) => (value === "" ? "A name is required" : undefined),
    });
    act(() => controller().begin());
    act(() => {
      result.current.state.setDraft("");
    });
    await act(async () => {
      controller().onEditorKeyDown(enter);
      await Promise.resolve();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.validation.errorFor("1", "name")).toBe(
      "A name is required"
    );
    // The editor is still the reader's, holding what they typed.
    expect(result.current.state.isActive("1", "name")).toBe(true);
    expect(controller().error).toBe("A name is required");
  });

  it("tells a lifecycle observer the validator refused, without sending", async () => {
    const onValidationFail = vi.fn();
    const { onCellEdit, result, controller } = setup({
      validate: (value) => (value === "" ? "A name is required" : undefined),
      lifecycle: { onValidationFail },
    });
    act(() => controller().begin());
    act(() => {
      result.current.state.setDraft("");
    });
    await act(async () => {
      controller().onEditorKeyDown(enter);
      await Promise.resolve();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(onValidationFail).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        rowId: "1",
        columnKey: "name",
        value: "",
        unit: "cell",
        error: "A name is required",
      })
    );
  });

  it("lets a passing value through and closes the editor", async () => {
    const { onCellEdit, result, controller } = setup({
      validate: (value) => (value === "" ? "A name is required" : undefined),
    });
    act(() => controller().begin());
    act(() => {
      result.current.state.setDraft("Augusta");
    });
    await act(async () => {
      controller().onEditorKeyDown(enter);
      await Promise.resolve();
    });
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "name",
      "Augusta"
    );
    expect(result.current.state.isActive("1", "name")).toBe(false);
  });

  it("holds the editor open and busy while an async check runs", async () => {
    let settle: ((message?: string) => void) | undefined;
    const { onCellEdit, result, controller } = setup({
      validate: () =>
        new Promise<string | undefined>((resolve) => {
          settle = resolve;
        }),
    });
    act(() => controller().begin());
    act(() => {
      controller().onEditorKeyDown(enter);
    });
    expect(controller().validating).toBe(true);
    expect(result.current.state.isActive("1", "name")).toBe(true);
    expect(onCellEdit).not.toHaveBeenCalled();

    await act(async () => {
      settle?.(undefined);
      await Promise.resolve();
    });
    expect(controller().validating).toBe(false);
    expect(onCellEdit).toHaveBeenCalledOnce();
  });

  it("shows a row-level message under the cell being edited", async () => {
    const { onCellEdit, result, controller } = setup({
      validateRow: () => "Those two dates disagree",
    });
    act(() => controller().begin());
    await act(async () => {
      controller().onEditorKeyDown(enter);
      await Promise.resolve();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    // A row rule has no cell of its own; it shows where the reader is.
    expect(controller().error).toBe("Those two dates disagree");
    expect(result.current.validation.rowErrorFor("1")).toBe(
      "Those two dates disagree"
    );
  });

  it("forgets the message when the reader gives up", async () => {
    const { result, controller } = setup({ validate: () => "no" });
    act(() => controller().begin());
    await act(async () => {
      controller().onEditorKeyDown(enter);
      await Promise.resolve();
    });
    expect(controller().error).toBe("no");
    act(() => {
      controller().onEditorKeyDown({
        key: "Escape",
        preventDefault: () => undefined,
      });
    });
    expect(result.current.validation.errorFor("1", "name")).toBeUndefined();
  });

  it("does not advance to the next cell over a rejected value", async () => {
    const { result, controller } = setup({ validate: () => "no" });
    act(() => controller().begin());
    await act(async () => {
      controller().onEditorKeyDown({
        key: "Tab",
        preventDefault: () => undefined,
      });
      await Promise.resolve();
    });
    // Moving on would put the cursor past the message they need to read.
    expect(result.current.state.isActive("1", "name")).toBe(true);
    expect(result.current.state.isActive("1", "age")).toBe(false);
  });

  it("commits on blur through the validators", async () => {
    const { onCellEdit, result, controller } = setup({
      validate: (value) => (value === "" ? "required" : undefined),
    });
    act(() => controller().begin());
    act(() => {
      result.current.state.setDraft("");
    });
    await act(async () => {
      controller().commitOnBlur();
      await Promise.resolve();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.validation.errorFor("1", "name")).toBe("required");
  });
});

describe("editableCellController — saving", () => {
  const enter = { key: "Enter", preventDefault: () => undefined };

  /** A controller over live editing state and live save state. */
  const setup = (
    onCellEdit: (row: Person, key: string, next: unknown) => unknown,
    onRollback?: (previous: Person, columnKey: string) => void
  ) => {
    const columns: ColumnDef<Person>[] = [{ key: "name", editable: true }];
    const { result } = mount({
      state: cellEditing(),
      saving: cellSave<Person>({ onRollback }),
    });
    const controller = () =>
      editableCellController({
        editing: {
          onCellEdit,
          state: result.current.state,
          saving: result.current.saving,
        },
        row: ROWS[0]!,
        column: columns[0]!,
        rowId: "1",
        rows: ROWS,
        columns,
        rowKey: (r) => r.id,
      });
    return { result, controller };
  };

  it("reports a save in flight, then done", async () => {
    let settle: (() => void) | undefined;
    const { controller } = setup(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        })
    );
    act(() => controller().begin());
    act(() => {
      controller().onEditorKeyDown(enter);
    });
    expect(controller().saveStatus).toBe("saving");

    await act(async () => {
      settle?.();
      await Promise.resolve();
    });
    expect(controller().saveStatus).toBeUndefined();
  });

  it("reports a failure and offers no undo without a handler", async () => {
    const { controller } = setup(() =>
      Promise.reject(new Error("Someone else changed this row"))
    );
    act(() => controller().begin());
    await act(async () => {
      controller().onEditorKeyDown(enter);
      await Promise.resolve();
    });
    expect(controller().saveStatus).toBe("failed");
    expect(controller().saveFailure?.message).toBe(
      "Someone else changed this row"
    );
    // An undo control that would do nothing when pressed is worse than none.
    expect(controller().canRollback).toBe(false);
  });

  it("rolls back through the host, and dismisses without one", async () => {
    const onRollback = vi.fn();
    const { controller } = setup(
      () => Promise.reject(new Error("Conflict")),
      onRollback
    );
    act(() => controller().begin());
    await act(async () => {
      controller().onEditorKeyDown(enter);
      await Promise.resolve();
    });
    expect(controller().canRollback).toBe(true);
    act(() => {
      controller().rollback();
    });
    expect(onRollback).toHaveBeenCalledExactlyOnceWith(ROWS[0], "name");
    expect(controller().saveStatus).toBeUndefined();

    // And dismissing a later failure restores nothing.
    act(() => controller().begin());
    await act(async () => {
      controller().onEditorKeyDown(enter);
      await Promise.resolve();
    });
    act(() => {
      controller().dismissFailure();
    });
    expect(controller().saveStatus).toBeUndefined();
    expect(onRollback).toHaveBeenCalledOnce();
  });

  it("has inert save actions when the host never opted into editing", () => {
    const ctrl = editableCellController({
      editing: undefined,
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    ctrl.commit();
    ctrl.cancel();
    ctrl.rollback();
    ctrl.dismissFailure();
    expect(ctrl.saveStatus).toBeUndefined();
    expect(ctrl.canRollback).toBe(false);
  });
});

describe("editableCellController — small rules", () => {
  it("opens no editor on a column the reader cannot edit", () => {
    const state = cellEditing();
    expect(beginCellEdit(state.current, ROWS[0]!, COLS[2]!, (r) => r.id)).toBe(
      false
    );
    expect(state.current.active).toBeNull();
  });

  it("cancels through the controller, and ignores a blur elsewhere", () => {
    const onCellEdit = vi.fn();
    const { result } = mount({
      state: cellEditing(),
      validation: editValidation<Person>(),
    });
    const controller = (column = 0) =>
      editableCellController({
        editing: {
          onCellEdit,
          state: result.current.state,
          validation: result.current.validation,
        },
        row: ROWS[0]!,
        column: COLS[column]!,
        rowId: "1",
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
      });
    controller().begin();
    controller(1).commitOnBlur();
    expect(result.current.state.isActive("1", "name")).toBe(true);
    controller().cancel();
    expect(result.current.state.active).toBeNull();
    expect(result.current.validation.rowHasError("1")).toBe(false);
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it("stops a key at the cell and focuses an editor that mounts", () => {
    const stopPropagation = vi.fn();
    stopCellEditKeyboard({ stopPropagation });
    expect(stopPropagation).toHaveBeenCalledOnce();
    const focus = vi.fn();
    focusEditorOnMount({ focus });
    focusEditorOnMount(null);
    expect(focus).toHaveBeenCalledOnce();
  });

  it("commits on demand, gated or not, and only from the open cell", async () => {
    const onCellEdit = vi.fn();
    const { result } = mount({
      state: cellEditing(),
      validation: editValidation<Person>(),
    });
    const controller = (gated: boolean) =>
      editableCellController({
        editing: {
          onCellEdit,
          state: result.current.state,
          validation: gated ? result.current.validation : undefined,
        },
        row: ROWS[0]!,
        column: gated
          ? { key: "name", editable: true, validate: () => undefined }
          : COLS[0]!,
        rowId: "1",
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
      });
    controller(false).commit();
    expect(onCellEdit).not.toHaveBeenCalled();
    controller(false).begin();
    result.current.state.setDraft("Augusta");
    controller(false).commit();
    expect(onCellEdit).toHaveBeenLastCalledWith(ROWS[0], "name", "Augusta");
    controller(true).begin();
    result.current.state.setDraft("Ada L.");
    await act(async () => {
      controller(true).commit();
      await Promise.resolve();
    });
    expect(onCellEdit).toHaveBeenLastCalledWith(ROWS[0], "name", "Ada L.");
  });

  it("drops a commit whose row has left the table", async () => {
    const onCellEdit = vi.fn();
    const enter = { key: "Enter", preventDefault: () => undefined };
    for (const gated of [false, true]) {
      const { result } = mount({
        state: cellEditing(),
        validation: editValidation<Person>({
          validateRow: gated ? () => undefined : undefined,
        }),
      });
      const controller = () =>
        editableCellController({
          editing: {
            onCellEdit,
            state: result.current.state,
            validation: result.current.validation,
          },
          row: { id: "9", name: "Gone", age: 1 },
          column: COLS[0]!,
          rowId: "9",
          rows: ROWS,
          columns: COLS,
          rowKey: (r) => r.id,
        });
      controller().begin();
      await act(async () => {
        controller().onEditorKeyDown(enter);
        await Promise.resolve();
      });
    }
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it("wraps from the last editable cell to the first on Tab", () => {
    const onCellEdit = vi.fn();
    const state = cellEditing();
    const controller = () =>
      editableCellController({
        editing: { onCellEdit, state: state.current },
        row: ROWS[1]!,
        column: COLS[1]!,
        rowId: "2",
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
      });
    controller().begin();
    controller().onEditorKeyDown({
      key: "Tab",
      preventDefault: () => undefined,
    });
    expect(onCellEdit).toHaveBeenCalledOnce();
    expect(state.current.active).toEqual({ rowId: "1", columnKey: "name" });
  });
});
