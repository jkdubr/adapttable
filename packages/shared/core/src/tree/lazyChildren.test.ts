import { describe, expect, it, vi } from "vitest";

import { createLazyChildrenController } from "./lazyChildren";

interface Node {
  id: string;
  loaded?: boolean;
}

const getRowId = (row: Node) => row.id;
const hasLoadedChildren = (row: Node) => row.loaded === true;

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("createLazyChildrenController", () => {
  it("is inert without a loader or when children are in hand", () => {
    const controller = createLazyChildrenController<Node>({
      getRowId,
      hasLoadedChildren,
    });
    controller.loadIfNeeded({ id: "a" });
    expect(controller.getSnapshot().loadingIds.size).toBe(0);

    const onLoadChildren = vi.fn();
    controller.configure({ getRowId, hasLoadedChildren, onLoadChildren });
    controller.loadIfNeeded({ id: "a", loaded: true });
    expect(onLoadChildren).not.toHaveBeenCalled();
  });

  it("marks a node loading until its fetch resolves, and asks once", async () => {
    const pending = deferred();
    const onLoadChildren = vi.fn(() => pending.promise);
    const controller = createLazyChildrenController<Node>({
      getRowId,
      hasLoadedChildren,
      onLoadChildren,
    });
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.loadIfNeeded({ id: "a" });
    controller.loadIfNeeded({ id: "a" });
    expect(onLoadChildren).toHaveBeenCalledTimes(1);
    expect([...controller.getSnapshot().loadingIds]).toEqual(["a"]);

    pending.resolve();
    await pending.promise;
    await Promise.resolve();
    expect(controller.getSnapshot().loadingIds.size).toBe(0);
    expect(controller.getSnapshot().failedIds.size).toBe(0);
    // A fetch that returned nothing is not repeated.
    controller.loadIfNeeded({ id: "a" });
    expect(onLoadChildren).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("records a rejected fetch, reports it, and retries on the next open", async () => {
    const onLoadFailed = vi.fn();
    const onLoadChildren = vi.fn(() => Promise.reject(new Error("offline")));
    const controller = createLazyChildrenController<Node>({
      getRowId,
      hasLoadedChildren,
      onLoadChildren,
      onLoadFailed,
    });
    controller.loadIfNeeded({ id: "a" });
    await vi.waitFor(() => {
      expect(onLoadFailed).toHaveBeenCalledWith({ id: "a" }, "a");
    });
    expect([...controller.getSnapshot().failedIds]).toEqual(["a"]);
    expect(controller.getSnapshot().loadingIds.size).toBe(0);

    onLoadChildren.mockImplementation(
      () => new Promise<never>(() => undefined)
    );
    controller.loadIfNeeded({ id: "a" });
    expect(onLoadChildren).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot().failedIds.size).toBe(0);
    expect([...controller.getSnapshot().loadingIds]).toEqual(["a"]);
  });

  it("settles a loader that throws synchronously, without a failure handler", () => {
    const controller = createLazyChildrenController<Node>({
      getRowId,
      hasLoadedChildren,
      onLoadChildren: () => {
        throw new Error("boom");
      },
    });
    const other = controller.getSnapshot().failedIds;
    controller.loadIfNeeded({ id: "b" });
    expect(controller.getSnapshot().loadingIds.size).toBe(0);
    expect([...controller.getSnapshot().failedIds]).toEqual(["b"]);
    expect(controller.getSnapshot().failedIds).not.toBe(other);
  });

  it("ignores a fetch that settles after the tree unmounted", async () => {
    const pending = deferred();
    const controller = createLazyChildrenController<Node>({
      getRowId,
      hasLoadedChildren,
      onLoadChildren: () => pending.promise,
    });
    const disconnect = controller.connect();
    controller.loadIfNeeded({ id: "a" });
    disconnect();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    pending.resolve();
    await pending.promise;
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
    expect([...controller.getSnapshot().loadingIds]).toEqual(["a"]);
    unsubscribe();
  });
});
