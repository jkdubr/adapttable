import {
  expandChevronIcon,
  FILTERS_ICON,
  SEARCH_ICON,
} from "@adapttable/core/binding";
import type { ReactElement } from "react";

import { IconSvg } from "./iconSvg";

/**
 * Shared chrome glyphs (currentColor, no icon-lib dependency) used by the
 * toolbar across adapters — a funnel for the Filters button and a magnifier
 * for the search field. The shapes are `@adapttable/core`'s, so every binding
 * draws the same glyph; these components draw them as React elements.
 */

/**
 * Three-line funnel glyph for the Filters button.
 *
 * @public
 */
export function FiltersIcon(): ReactElement {
  return <IconSvg icon={FILTERS_ICON} />;
}

/**
 * Magnifier glyph for the search field.
 *
 * @public
 */
export function SearchIcon(): ReactElement {
  return <IconSvg icon={SEARCH_ICON} />;
}

/**
 * Inline expand chevron: points into the row (flipped for RTL) and rotates to
 * point down while the detail panel is open. Shared by every adapter's
 * desktop row + mobile card so the expand affordance is identical.
 *
 * @public
 */
export function ExpandChevron({
  open,
  dir,
}: Readonly<{ open: boolean; dir?: "rtl" | "ltr" }>): ReactElement {
  return <IconSvg icon={expandChevronIcon({ open, dir })} />;
}
