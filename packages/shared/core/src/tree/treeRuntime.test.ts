import { describe, expect, it, vi } from "vitest";

import { createControllableStore } from "../state/controllableStore";
import type { TreeEntry } from "./treeRows";
import {
  closeFailedTreeNode,
  toggleTreeNode,
  treeExpansionActions,
  treeExportExpandedIds,
} from "./treeRuntime";

interface Node {
  id: string;
  parent?: string;
  children?: Node[];
}

function entry(
  key: string,
  expanded: boolean,
  descendantIds: string[] = []
): TreeEntry<Node> {
  return {
    row: { id: key },
    key,
    level: 0,
    hasChildren: true,
    expanded,
    path: [],
    descendantIds,
  };
}

describe("treeExpansionActions", () => {
  it("toggles, expands once, opens many and folds all", () => {
    const store = createControllableStore<ReadonlySet<string>>(new Set());
    const actions = treeExpansionActions(store);
    actions.toggle("a");
    expect([...store.getSnapshot()]).toEqual(["a"]);
    const before = store.getSnapshot();
    actions.expand("a");
    expect(store.getSnapshot()).toBe(before);
    actions.expand("b");
    expect([...store.getSnapshot()]).toEqual(["a", "b"]);
    actions.toggle("a");
    expect([...store.getSnapshot()]).toEqual(["b"]);
    actions.expandAll(["x", "y"]);
    expect([...store.getSnapshot()]).toEqual(["x", "y"]);
    actions.collapseAll();
    expect(store.getSnapshot().size).toBe(0);
  });
});

describe("toggleTreeNode", () => {
  it("fetches before opening a closed node, never before closing", () => {
    const loadIfNeeded = vi.fn();
    const toggle = vi.fn();
    const entries = [entry("a", false), entry("b", true)];
    toggleTreeNode(entries, "a", { loadIfNeeded, toggle });
    expect(loadIfNeeded).toHaveBeenCalledWith({ id: "a" });
    toggleTreeNode(entries, "b", { loadIfNeeded, toggle });
    toggleTreeNode(entries, "gone", { loadIfNeeded, toggle });
    expect(loadIfNeeded).toHaveBeenCalledTimes(1);
    expect(toggle.mock.calls).toEqual([["a"], ["b"], ["gone"]]);
  });
});

describe("closeFailedTreeNode", () => {
  it("closes an open node and leaves a closed one alone", () => {
    const toggle = vi.fn();
    closeFailedTreeNode({ isExpanded: (id) => id === "a", toggle }, "a");
    closeFailedTreeNode({ isExpanded: () => false, toggle }, "b");
    expect(toggle.mock.calls).toEqual([["a"]]);
  });
});

describe("treeExportExpandedIds", () => {
  it("opens every node and every descendant", () => {
    expect([
      ...treeExportExpandedIds([
        entry("a", false, ["a1", "a2"]),
        entry("b", true),
      ]),
    ]).toEqual(["a", "a1", "a2", "b"]);
  });
});
