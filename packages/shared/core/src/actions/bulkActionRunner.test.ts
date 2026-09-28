/**
 * The bulk-action runner and the "select all matching" banner.
 */
import { describe, expect, it, vi } from "vitest";

import { resolveLabels } from "../labels";
import type { BulkAction } from "../types";
import {
  bulkActionErrorMessage,
  bulkBarModel,
  createBulkActionRunner,
} from "./bulkActionRunner";
import type { ConfirmRequest } from "./confirm";

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("bulkActionErrorMessage", () => {
  it("renders each kind of rejection as text", () => {
    expect(bulkActionErrorMessage(null)).toBeNull();
    expect(bulkActionErrorMessage(undefined)).toBeNull();
    expect(bulkActionErrorMessage(new Error("nope"))).toBe("nope");
    expect(bulkActionErrorMessage("plain")).toBe("plain");
    expect(bulkActionErrorMessage(4)).toBe("4");
    expect(bulkActionErrorMessage(false)).toBe("false");
    expect(bulkActionErrorMessage(5n)).toBe("5");
    expect(bulkActionErrorMessage({ code: 1 })).toBe('{"code":1}');
    expect(bulkActionErrorMessage(Symbol("s"))).toBe("Unknown error");
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(bulkActionErrorMessage(cyclic)).toBe("Unknown error");
  });
});

describe("createBulkActionRunner", () => {
  const action = (
    onClick: BulkAction["onClick"],
    confirm?: BulkAction["confirm"]
  ): BulkAction => ({ key: "archive", label: "Archive", onClick, confirm });

  it("runs, reports pending, and completes with success", async () => {
    const onComplete = vi.fn();
    const runner = createBulkActionRunner({
      confirm: vi.fn(),
      cancelLabel: "Cancel",
      onComplete,
    });
    const listener = vi.fn();
    const unsubscribe = runner.subscribe(listener);
    const onClick = vi.fn(() => Promise.resolve());
    runner.run(action(onClick), ["a", "b"]);
    expect(runner.getSnapshot()).toEqual({ pending: "archive", error: null });
    await settle();
    expect(onClick).toHaveBeenCalledWith(["a", "b"], {
      allMatching: false,
      total: 2,
    });
    expect(onComplete).toHaveBeenCalledWith({ status: "success" });
    expect(runner.getSnapshot()).toEqual({ pending: null, error: null });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("does nothing for an empty list", () => {
    const onClick = vi.fn();
    const runner = createBulkActionRunner({
      confirm: vi.fn(),
      cancelLabel: "Cancel",
    });
    runner.run(action(onClick), []);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps a rejection as the error and reports it", async () => {
    const onComplete = vi.fn();
    const runner = createBulkActionRunner({
      confirm: vi.fn(),
      cancelLabel: "Cancel",
    });
    runner.configure({ confirm: vi.fn(), cancelLabel: "Cancel", onComplete });
    const failure = new Error("offline");
    runner.run(
      action(() => Promise.reject(failure)),
      ["a"],
      { allMatching: true, total: 40 }
    );
    await settle();
    expect(runner.getSnapshot()).toEqual({ pending: null, error: failure });
    expect(onComplete).toHaveBeenCalledWith({
      status: "error",
      error: failure,
    });
  });

  it("works without an onComplete", async () => {
    const runner = createBulkActionRunner({
      confirm: vi.fn(),
      cancelLabel: "Cancel",
    });
    runner.run(
      action(() => Promise.reject(new Error("x"))),
      ["a"]
    );
    await settle();
    runner.run(
      action(() => undefined),
      ["a"]
    );
    await settle();
    expect(runner.getSnapshot().error).toBeNull();
  });

  it("confirms first, with the scope's count", async () => {
    let request: ConfirmRequest | undefined;
    const runner = createBulkActionRunner({
      confirm: (next) => {
        request = next;
      },
      cancelLabel: "Keep",
    });
    const onClick = vi.fn();
    runner.run(
      action(onClick, {
        title: "Delete?",
        message: (count) => `Delete ${String(count)}?`,
        confirmLabel: "Delete",
        danger: true,
      }),
      ["a"],
      { allMatching: true, total: 90 }
    );
    expect(onClick).not.toHaveBeenCalled();
    expect(request).toMatchObject({
      title: "Delete?",
      message: "Delete 90?",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      danger: true,
    });
    request?.onConfirm();
    await settle();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("bulkBarModel", () => {
  const labels = resolveLabels(undefined);
  const selection = {
    allMatching: false,
    acrossPages: true,
    headerState: "all" as const,
    visibleIds: ["a", "b"],
  };

  it("offers every matching row once a full page is selected", () => {
    const model = bulkBarModel(selection, 10, labels);
    expect(model.expandable).toBe(true);
    expect(model.scope).toBeUndefined();
    expect(model.banner).toEqual({
      text: labels.pageSelected(2),
      action: labels.selectAllMatching(10),
      command: "select-all-matching",
    });
  });

  it("scopes actions to the whole set once all matching is on", () => {
    const model = bulkBarModel({ ...selection, allMatching: true }, 10, labels);
    expect(model.scope).toEqual({ allMatching: true, total: 10 });
    expect(model.banner).toEqual({
      text: labels.allMatchingSelected(10),
      action: labels.clearAll,
      command: "clear",
    });
  });

  it("does not offer it when nothing more matches", () => {
    expect(bulkBarModel(selection, 2, labels).expandable).toBe(false);
  });
});
