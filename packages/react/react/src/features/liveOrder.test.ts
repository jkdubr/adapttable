import {
  CHROME_EXTRA_SLOT_ORDER,
  SHELL_LIVE_STAGE_ORDER,
} from "@adapttable/core/binding";
import { describe, expect, it } from "vitest";

import { EXTRA_SLOTS } from "./chromeExtrasGate";
import { LIVE_STAGES } from "./shellLiveGate";

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter, index: number) =>
    index === 0 ? letter.toLowerCase() : `-${letter.toLowerCase()}`
  );
}

describe("chrome order", () => {
  it("mounts the extra slots in core's order", () => {
    expect(EXTRA_SLOTS.map((slot) => slot.id)).toEqual(CHROME_EXTRA_SLOT_ORDER);
  });

  it("chains the live stages in core's order", () => {
    expect(
      LIVE_STAGES.map(
        (stage) => `${kebab(stage.name.replace(/Stage$/, ""))}-live`
      )
    ).toEqual(SHELL_LIVE_STAGE_ORDER);
  });
});
