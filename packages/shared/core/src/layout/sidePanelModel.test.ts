/**
 * The side panel's tablist model and the keys its tabs and body answer.
 */
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_SIDE_PANEL_ID_PREFIX,
  handleSidePanelBodyKey,
  handleSidePanelTabKey,
  sidePanelModel,
  sidePanelTabId,
  sidePanelTabIndex,
} from "./sidePanelModel";

const panels = [
  { key: "columns", label: "Columns" },
  { key: "filters", label: "Filters" },
  { key: "pivot", label: "Pivot" },
];

const keyEvent = (key: string) => ({
  key,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

describe("sidePanelTabIndex", () => {
  it("wraps arrows and jumps with Home and End", () => {
    expect(sidePanelTabIndex("ArrowRight", 2, 3)).toBe(0);
    expect(sidePanelTabIndex("ArrowDown", 0, 3)).toBe(1);
    expect(sidePanelTabIndex("ArrowLeft", 0, 3)).toBe(2);
    expect(sidePanelTabIndex("ArrowUp", 2, 3)).toBe(1);
    expect(sidePanelTabIndex("Home", 2, 3)).toBe(0);
    expect(sidePanelTabIndex("End", 0, 3)).toBe(2);
    expect(sidePanelTabIndex("a", 0, 3)).toBeUndefined();
  });
});

describe("sidePanelModel", () => {
  it("is nothing without panels", () => {
    expect(sidePanelModel({ panels: [], openPanel: "x" })).toBeNull();
  });

  it("wires a strip of tabs to the body", () => {
    const model = sidePanelModel({
      panels,
      openPanel: "filters",
      idPrefix: "t",
    });
    expect(model).toMatchObject({
      selectedIndex: 1,
      selected: panels[1],
      tabbed: true,
      tablistLabel: "Table settings",
      closeLabel: "Close panel",
      bodyId: "t-body",
      bodyRole: "tabpanel",
      bodyLabelledBy: "t-tab-filters",
      bodyLabel: undefined,
    });
    expect(model?.tabs[1]).toEqual({
      panel: panels[1],
      key: "filters",
      id: "t-tab-filters",
      selected: true,
      tabIndex: 0,
      controls: "t-body",
    });
    expect(model?.tabs[0]?.tabIndex).toBe(-1);
  });

  it("falls back to the first panel and names a lone body itself", () => {
    const model = sidePanelModel({
      panels: [panels[0] ?? { key: "", label: "" }],
      openPanel: "unknown",
      labels: { sidePanel: "Réglages", closePanel: "Fermer" },
    });
    expect(model).toMatchObject({
      selectedIndex: 0,
      tabbed: false,
      tablistLabel: "Réglages",
      closeLabel: "Fermer",
      bodyId: `${DEFAULT_SIDE_PANEL_ID_PREFIX}-body`,
      bodyRole: undefined,
      bodyLabelledBy: undefined,
      bodyLabel: "Columns",
    });
    expect(sidePanelTabId("p", "k")).toBe("p-tab-k");
  });
});

describe("handleSidePanelTabKey", () => {
  const run = (key: string, list = panels) => {
    const event = keyEvent(key);
    const onOpenPanel = vi.fn();
    const onClose = vi.fn();
    const result = handleSidePanelTabKey(event, {
      panels: list,
      selectedIndex: 0,
      onOpenPanel,
      onClose,
    });
    return { event, onOpenPanel, onClose, result };
  };

  it("closes on Escape and stops there", () => {
    const { event, onClose, result } = run("Escape");
    expect(result).toBeUndefined();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("moves the selection and says which tab to focus", () => {
    const { event, onOpenPanel, result } = run("ArrowLeft");
    expect(result).toBe("pivot");
    expect(event.preventDefault).toHaveBeenCalled();
    expect(onOpenPanel).toHaveBeenCalledWith("pivot");
  });

  it("ignores other keys and an empty strip", () => {
    expect(run("a").result).toBeUndefined();
    const empty = run("ArrowRight", []);
    expect(empty.result).toBeUndefined();
    expect(empty.event.preventDefault).not.toHaveBeenCalled();
  });
});

describe("handleSidePanelBodyKey", () => {
  it("closes on Escape only", () => {
    const onClose = vi.fn();
    const other = keyEvent("a");
    expect(handleSidePanelBodyKey(other, onClose)).toBe(false);
    const escape = keyEvent("Escape");
    expect(handleSidePanelBodyKey(escape, onClose)).toBe(true);
    expect(escape.stopPropagation).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
