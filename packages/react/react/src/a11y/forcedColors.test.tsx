import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ForcedColorsStyle } from "./forcedColors";

const FORCED_COLORS_STYLE_ID = "adapttable-forced-colors";

afterEach(() => {
  document.getElementById(FORCED_COLORS_STYLE_ID)?.remove();
});

describe("ForcedColorsStyle", () => {
  it("installs the stylesheet on mount", () => {
    const { unmount } = render(<ForcedColorsStyle />);
    expect(document.getElementById(FORCED_COLORS_STYLE_ID)).not.toBeNull();
    unmount();
    // The sheet is a document singleton — unmounting a table must not drop
    // it while another table on the page still needs it.
    expect(document.getElementById(FORCED_COLORS_STYLE_ID)).not.toBeNull();
  });
});
