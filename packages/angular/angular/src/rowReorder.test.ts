import { describe, expect, it, vi } from "vitest";

import { featureOptionsOf } from "./features";
import { rowReorder } from "./rowReorder";

describe("rowReorder feature", () => {
  it("registers under the row-reorder id with the host handler", () => {
    const onRowReorder = vi.fn();
    const feature = rowReorder(onRowReorder);
    expect(feature.id).toBe("row-reorder");
    expect(featureOptionsOf([feature])).toEqual({});
  });
});
