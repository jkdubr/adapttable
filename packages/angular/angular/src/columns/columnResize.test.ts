import { describe, expect, it, vi } from "vitest";

import { injectColumnResize } from "./columnResize";

describe("injectColumnResize", () => {
  it("names the column and hands the width back to the layout", () => {
    const setWidth = vi.fn();
    const props = injectColumnResize("name", setWidth, "Resize column: Name");
    expect(props.role).toBe("button");
    expect(props.tabIndex).toBe(0);
    expect(props["aria-label"]).toBe("Resize column: Name");
    expect(typeof props.onPointerDown).toBe("function");
    expect(typeof props.onKeyDown).toBe("function");
    expect(typeof props.onDoubleClick).toBe("function");
  });
});
