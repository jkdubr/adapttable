import { describe, expect, it } from "vitest";

import { assistantIsBusy, assistantIsUsable } from "./assistantView";

describe("assistantIsBusy", () => {
  it("is true only while a turn is sending", () => {
    expect(assistantIsBusy("sending")).toBe(true);
    expect(assistantIsBusy("ready")).toBe(false);
    expect(assistantIsBusy("awaiting-approval")).toBe(false);
  });
});

describe("assistantIsUsable", () => {
  it("is false while disconnected or connecting", () => {
    expect(assistantIsUsable("disconnected")).toBe(false);
    expect(assistantIsUsable("connecting")).toBe(false);
  });

  it("is true once connected, busy or not", () => {
    expect(assistantIsUsable("ready")).toBe(true);
    expect(assistantIsUsable("sending")).toBe(true);
  });
});
