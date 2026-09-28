import type { IconDescriptor, IconShape } from "@adapttable/core/binding";
import { createElement, type ReactElement, type SVGProps } from "react";

/** One shape of a core glyph as a React element. */
function shapeElement({ tag, ...attributes }: IconShape): ReactElement {
  const props: SVGProps<SVGElement> = attributes;
  return createElement(tag, props);
}

/**
 * Draw one of `@adapttable/core`'s glyph descriptors as an inline `<svg>`.
 *
 * Every glyph is decorative, so the element is hidden from assistive
 * technology; the control around it carries the name.
 *
 * @internal
 */
export function IconSvg({
  icon,
}: Readonly<{ icon: IconDescriptor }>): ReactElement {
  const { shapes, ...attributes } = icon;
  return createElement(
    "svg",
    { ...attributes, "aria-hidden": "true" },
    ...shapes.map(shapeElement)
  );
}
