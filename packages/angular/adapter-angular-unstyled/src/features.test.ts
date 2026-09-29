import { featureOptionsOf } from "@adapttable/angular";
import { describe, expect, it, vi } from "vitest";

import {
  batchEditing,
  cellNavigation,
  editing,
  rowEditing,
  rowReorder,
  virtualize,
} from "./features";

describe("unstyled Angular feature wrappers", () => {
  it("arms virtualize with the windowing knobs", () => {
    expect(featureOptionsOf([virtualize()])).toMatchObject({
      virtualize: true,
    });
    expect(
      featureOptionsOf([
        virtualize({ estimateRowSize: 72, virtualOverscan: 4 }),
      ])
    ).toMatchObject({
      virtualize: true,
      estimateRowSize: 72,
      virtualOverscan: 4,
    });
    expect(featureOptionsOf([virtualize(false)])).toMatchObject({
      virtualize: false,
    });
  });

  it("arms cell navigation", () => {
    expect(featureOptionsOf([cellNavigation()])).toMatchObject({
      cellNavigation: true,
    });
  });

  it("arms row reorder under the row-reorder id", () => {
    const onRowReorder = vi.fn();
    const feature = rowReorder(onRowReorder);
    expect(feature.id).toBe("row-reorder");
    expect(featureOptionsOf([feature])).toEqual({});
  });

  it("arms cell, row and batch editing", () => {
    const onCellEdit = vi.fn();
    const onRowEdit = vi.fn();
    const onBatchEdit = vi.fn();
    expect(featureOptionsOf([editing(onCellEdit)])).toMatchObject({
      onCellEdit,
    });
    expect(featureOptionsOf([rowEditing(onRowEdit)])).toMatchObject({
      rowEditing: true,
      onRowEdit,
    });
    expect(featureOptionsOf([batchEditing(onBatchEdit)])).toMatchObject({
      batchEditing: true,
      onBatchEdit,
    });
  });
});
