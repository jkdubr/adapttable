/**
 * High-contrast chrome that every kit mounts once.
 *
 * Core stays headless: this is a `<style>` tag, not a painted control. Windows
 * High Contrast (`forced-colors: active`) drops authored fills and box-shadows,
 * so focus, selection, dirty cells, validation and find hits each keep a
 * system-color *outline*. `prefers-contrast: more` thickens the same focus
 * outline for kits that expose no contrast hook of their own.
 */
import { ensureForcedColorsStyles } from "@adapttable/core/binding";
import { useEffect } from "react";

export {
  ensureForcedColorsStyles,
  FORCED_COLORS_CSS,
} from "@adapttable/core/binding";

/**
 * Mount-time hook that installs the high-contrast stylesheet.
 *
 * Renders nothing. Every published kit mounts this once from its table root.
 *
 * @public
 */
export function ForcedColorsStyle(): null {
  useEffect(() => {
    ensureForcedColorsStyles();
  }, []);
  return null;
}
