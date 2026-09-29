import { describe, expect, it, vi } from "vitest";

import { editing } from "./editing";
import { featureOptionsOf } from "./features";

describe("editing feature", () => {
  it("arms onCellEdit on the merged patch", () => {
    const onCellEdit = vi.fn();
    expect(featureOptionsOf([editing(onCellEdit)])).toMatchObject({
      onCellEdit,
    });
  });
});
