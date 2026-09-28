import { describe, expect, it, vi } from "vitest";

import { createControllableStore } from "../state/controllableStore";
import type { RowAction } from "../types";
import {
  commitRowPin,
  DELETE_ROW_ACTION_KEY,
  DUPLICATE_ROW_ACTION_KEY,
  PIN_BOTTOM_ACTION_KEY,
  PIN_TOP_ACTION_KEY,
  ROW_PIN_STORE_OPTIONS,
  rowMutationActions,
  rowPinActions,
  rowPinningBlockedWarning,
  rowPinningControl,
  rowPinningRequested,
  rowPinningUrlSync,
  UNPIN_ROW_ACTION_KEY,
  withRowMutationActions,
  withRowPinActions,
} from "./rowActionsRuntime";
import { EMPTY_ROW_PIN_STATE, type RowPinState } from "./rowPinModel";

interface Row {
  id: string;
}

const labels = {
  pinToTop: "Pin top",
  pinToBottom: "Pin bottom",
  unpinRow: "Unpin",
};

describe("row pin state", () => {
  it("pins, moves and unpins only while enabled", () => {
    const store = createControllableStore<RowPinState>(
      EMPTY_ROW_PIN_STATE,
      ROW_PIN_STORE_OPTIONS
    );
    const listener = vi.fn();
    store.subscribe(listener);
    commitRowPin(store, false, "a", "top");
    expect(store.getSnapshot()).toBe(EMPTY_ROW_PIN_STATE);
    commitRowPin(store, true, "a", "top");
    expect(store.getSnapshot()).toEqual({ top: ["a"], bottom: [] });
    commitRowPin(store, true, "a", "top");
    expect(listener).toHaveBeenCalledTimes(1);
    commitRowPin(store, true, "a", "bottom");
    expect(store.getSnapshot()).toEqual({ top: [], bottom: ["a"] });
    commitRowPin(store, true, "a", undefined);
    expect(store.getSnapshot()).toEqual({ top: [], bottom: [] });
  });

  it("offers each pin action only where it would change something", () => {
    const pin = vi.fn();
    const unpin = vi.fn();
    const sides: Record<string, "top" | "bottom"> = { t: "top", b: "bottom" };
    const actions = rowPinActions<Row>({
      labels,
      getRowId: (row) => row.id,
      sideOf: (id) => sides[id],
      pin,
      unpin,
    });
    expect(actions.map((action) => [action.key, action.label])).toEqual([
      [PIN_TOP_ACTION_KEY, "Pin top"],
      [PIN_BOTTOM_ACTION_KEY, "Pin bottom"],
      [UNPIN_ROW_ACTION_KEY, "Unpin"],
    ]);
    const hidden = (id: string) =>
      actions.map((action) => action.isHidden?.({ id }) === true);
    expect(hidden("t")).toEqual([true, false, false]);
    expect(hidden("b")).toEqual([false, true, false]);
    expect(hidden("n")).toEqual([false, false, true]);
    for (const action of actions) action.onClick?.({ id: "x" });
    expect(pin.mock.calls).toEqual([
      ["x", "top"],
      ["x", "bottom"],
    ]);
    expect(unpin).toHaveBeenCalledWith("x");
  });
});

describe("row pinning wiring", () => {
  it("is requested by the feature or either half of the pair", () => {
    expect(rowPinningRequested({})).toBe(false);
    expect(rowPinningRequested({ rowPinningArmed: true })).toBe(true);
    expect(rowPinningRequested({ pinnedRowIds: EMPTY_ROW_PIN_STATE })).toBe(
      true
    );
    expect(rowPinningRequested({ onPinnedRowIdsChange: () => undefined })).toBe(
      true
    );
  });

  it("warns only when requested over a nested list", () => {
    expect(rowPinningBlockedWarning(true, true)).toMatch(
      /row pinning is ignored/
    );
    expect(rowPinningBlockedWarning(true, false)).toBeUndefined();
    expect(rowPinningBlockedWarning(false, true)).toBeUndefined();
  });

  it("syncs the URL only when it holds the lists", () => {
    expect(rowPinningUrlSync({ requested: true })).toBe(true);
    expect(rowPinningUrlSync({ requested: true, urlSync: false })).toBe(false);
    expect(rowPinningUrlSync({ requested: false })).toBe(false);
    expect(
      rowPinningUrlSync({ requested: true, pinnedRowIds: EMPTY_ROW_PIN_STATE })
    ).toBe(false);
  });

  it("reads the host's lists first and writes the URL only when it holds them", () => {
    const writeUrl = vi.fn();
    const onChange = vi.fn();
    const next: RowPinState = { top: ["a"], bottom: [] };
    const url: RowPinState = { top: ["u"], bottom: [] };

    expect(
      rowPinningControl({ requested: false, urlPinnedRowIds: url, writeUrl })
    ).toEqual({ pinnedRowIds: undefined, onPinnedRowIdsChange: undefined });

    const fromUrl = rowPinningControl({
      requested: true,
      urlPinnedRowIds: url,
      writeUrl,
    });
    expect(fromUrl.pinnedRowIds).toBe(url);
    fromUrl.onPinnedRowIdsChange?.(next);
    expect(writeUrl).toHaveBeenCalledWith(next);

    const host = rowPinningControl({
      requested: true,
      pinnedRowIds: EMPTY_ROW_PIN_STATE,
      onPinnedRowIdsChange: onChange,
      urlPinnedRowIds: url,
      writeUrl,
    });
    expect(host.pinnedRowIds).toBe(EMPTY_ROW_PIN_STATE);
    host.onPinnedRowIdsChange?.(next);
    expect(onChange).toHaveBeenCalledWith(next);
    expect(writeUrl).toHaveBeenCalledTimes(1);
  });
});

describe("rowMutationActions", () => {
  const mutationLabels = {
    duplicateRow: "Duplicate",
    deleteRow: "Delete",
    deleteRowConfirm: "Sure?",
  };

  it("builds nothing the host did not wire", () => {
    expect(
      rowMutationActions<Row>({ confirmDelete: true, labels: mutationLabels })
    ).toEqual([]);
  });

  it("puts Duplicate before a confirmed, destructive Delete", () => {
    const duplicate = vi.fn();
    const remove = vi.fn();
    const [copy, del] = rowMutationActions<Row>({
      duplicate,
      remove,
      confirmDelete: true,
      labels: mutationLabels,
    });
    expect(copy).toMatchObject({
      key: DUPLICATE_ROW_ACTION_KEY,
      label: "Duplicate",
    });
    expect(del).toMatchObject({
      key: DELETE_ROW_ACTION_KEY,
      label: "Delete",
      color: "red",
      confirm: { title: "Delete", confirmLabel: "Delete", danger: true },
    });
    expect(del?.confirm?.message({ id: "a" })).toBe("Sure?");
    copy?.onClick?.({ id: "a" });
    del?.onClick?.({ id: "a" });
    expect(duplicate).toHaveBeenCalledWith({ id: "a" });
    expect(remove).toHaveBeenCalledWith({ id: "a" });
  });

  it("deletes without asking when confirmation is off", () => {
    const [del] = rowMutationActions<Row>({
      remove: vi.fn(),
      confirmDelete: false,
      labels: mutationLabels,
    });
    expect(del?.confirm).toBeUndefined();
  });
});

describe("merging row actions", () => {
  const open: RowAction<Row> = { key: "open", label: "Open", onClick: vi.fn() };
  const copy: RowAction<Row> = { key: "copy", label: "Copy", onClick: vi.fn() };
  const pin: RowAction<Row> = { key: "pin", label: "Pin", onClick: vi.fn() };

  it("appends the mutations after the host's own, handing the host's list back alone", () => {
    const host = [open];
    expect(
      withRowMutationActions({ host, mutations: [], actionsHidden: false })
        .rowActions
    ).toBe(host);
    expect(
      withRowMutationActions({ host, mutations: [copy], actionsHidden: false })
    ).toEqual({ rowActions: [open, copy], hasRowActions: true });
    expect(
      withRowMutationActions({ mutations: [copy], actionsHidden: false })
        .rowActions
    ).toEqual([copy]);
    expect(
      withRowMutationActions({ host, mutations: [copy], actionsHidden: true })
    ).toEqual({ rowActions: undefined, hasRowActions: true });
    expect(
      withRowMutationActions({ mutations: [], actionsHidden: false })
    ).toEqual({ rowActions: undefined, hasRowActions: false });
  });

  it("appends pin entries, giving pinning a column of its own", () => {
    const list = [open];
    expect(
      withRowPinActions({
        rowActions: list,
        hasRowActions: true,
        pinning: false,
        pins: [],
        actionsHidden: false,
      }).rowActions
    ).toBe(list);
    expect(
      withRowPinActions({
        hasRowActions: false,
        pinning: true,
        pins: [pin],
        actionsHidden: false,
      })
    ).toEqual({ rowActions: [pin], hasRowActions: true });
    expect(
      withRowPinActions({
        rowActions: list,
        hasRowActions: true,
        pinning: true,
        pins: [pin],
        actionsHidden: false,
      }).rowActions
    ).toEqual([open, pin]);
    expect(
      withRowPinActions({
        rowActions: list,
        hasRowActions: true,
        pinning: true,
        pins: [pin],
        actionsHidden: true,
      })
    ).toEqual({ rowActions: undefined, hasRowActions: true });
    expect(
      withRowPinActions({
        hasRowActions: false,
        pinning: false,
        pins: [],
        actionsHidden: false,
      })
    ).toEqual({ rowActions: undefined, hasRowActions: false });
  });
});
