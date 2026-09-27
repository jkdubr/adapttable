/**
 * The defaults a nested table is mounted with.
 */
import { describe, expect, it } from "vitest";

import {
  NESTED_TABLE_DEFAULT_LABEL,
  nestedTableDefaults,
  nestedTableLabel,
} from "./nestedTableDefaults";

describe("nestedTableDefaults", () => {
  it("never syncs the URL, hides search and inherits the parent", () => {
    const labels = { search: "Chercher" };
    expect(
      nestedTableDefaults("Orders", { density: "compact", labels })
    ).toEqual({
      urlSync: false,
      searchable: false,
      density: "compact",
      labels,
      tableLabel: "Orders",
    });
    expect(nestedTableDefaults("Orders")).toMatchObject({
      density: undefined,
      labels: undefined,
    });
  });

  it("names an unnamed table", () => {
    expect(nestedTableLabel(undefined)).toBe(NESTED_TABLE_DEFAULT_LABEL);
    expect(nestedTableLabel("Orders")).toBe("Orders");
  });
});
