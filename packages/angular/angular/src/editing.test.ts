import { describe, expect, it, vi } from "vitest";

import { batchEditing, editing, rowEditing } from "./editing";
import { featureOptionsOf } from "./features";

describe("editing features", () => {
  it("arms onCellEdit on the merged patch", () => {
    const onCellEdit = vi.fn();
    expect(featureOptionsOf([editing(onCellEdit)])).toMatchObject({
      onCellEdit,
    });
  });

  it("arms row editing", () => {
    const onRowEdit = vi.fn();
    expect(featureOptionsOf([rowEditing(onRowEdit)])).toMatchObject({
      rowEditing: true,
      onRowEdit,
    });
  });

  it("arms batch editing", () => {
    const onBatchEdit = vi.fn();
    expect(featureOptionsOf([batchEditing(onBatchEdit)])).toMatchObject({
      batchEditing: true,
      onBatchEdit,
    });
  });
});
