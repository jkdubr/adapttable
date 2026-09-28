import { eyeIcon, GRIP_ICON, PIN_ICON } from "@adapttable/core/binding";
import type { ReactElement } from "react";

import { IconSvg } from "../iconSvg";

/**
 * Shared column-menu glyphs (currentColor, no icon-lib dependency) so every
 * adapter's column popover looks identical: a drag grip, an eye visibility
 * toggle, and a pin. The shapes are `@adapttable/core`'s.
 */

/**
 * Six-dot drag grip.
 *
 * @public
 */
export function GripIcon(): ReactElement {
  return <IconSvg icon={GRIP_ICON} />;
}

/**
 * Eye (visible) / eye with slash (hidden) toggle glyph.
 *
 * @public
 */
export function EyeIcon({
  off = false,
}: Readonly<{ off?: boolean }>): ReactElement {
  return <IconSvg icon={eyeIcon(off)} />;
}

/**
 * Pin glyph.
 *
 * @public
 */
export function PinIcon(): ReactElement {
  return <IconSvg icon={PIN_ICON} />;
}
