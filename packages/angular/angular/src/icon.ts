/**
 * Core's glyphs, drawn as SVG. A glyph is data in `@adapttable/core` — the
 * same eye, pin, grip and chevron in every binding — and this draws it.
 */
import type { IconDescriptor } from "@adapttable/core/binding";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Draws an `IconDescriptor` into its `<svg>` host, hidden from assistive
 * technology: the control around it carries the name.
 *
 * ```html
 * <svg [adaptIcon]="pinIcon"></svg>
 * ```
 *
 * @public
 */
@Component({
  selector: "svg[adaptIcon]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "aria-hidden": "true",
    "[attr.viewBox]": "adaptIcon().viewBox",
    "[attr.width]": "adaptIcon().width",
    "[attr.height]": "adaptIcon().height",
    "[attr.fill]": "adaptIcon().fill ?? null",
    "[attr.stroke]": "adaptIcon().stroke ?? null",
    "[attr.stroke-width]": "adaptIcon().strokeWidth ?? null",
    "[attr.stroke-linecap]": "adaptIcon().strokeLinecap ?? null",
    "[attr.stroke-linejoin]": "adaptIcon().strokeLinejoin ?? null",
    "[attr.focusable]": "adaptIcon().focusable ?? null",
    "[style.transform]": "adaptIcon().style?.transform ?? null",
    "[style.transition]": "adaptIcon().style?.transition ?? null",
  },
  template: `
    @for (shape of adaptIcon().shapes; track $index) {
      @switch (shape.tag) {
        @case ("path") {
          <svg:path
            [attr.d]="shape.d"
            [attr.fill]="shape.fill ?? null"
            [attr.stroke]="shape.stroke ?? null"
            [attr.stroke-width]="shape.strokeWidth ?? null"
            [attr.stroke-linecap]="shape.strokeLinecap ?? null"
            [attr.stroke-linejoin]="shape.strokeLinejoin ?? null"
          />
        }
        @case ("circle") {
          <svg:circle
            [attr.cx]="shape.cx"
            [attr.cy]="shape.cy"
            [attr.r]="shape.r"
            [attr.fill]="shape.fill ?? null"
          />
        }
        @case ("rect") {
          <svg:rect
            [attr.x]="shape.x"
            [attr.y]="shape.y"
            [attr.width]="shape.width"
            [attr.height]="shape.height"
            [attr.rx]="shape.rx ?? null"
            [attr.fill]="shape.fill ?? null"
          />
        }
      }
    }
  `,
})
export class AdaptIcon {
  /** The glyph. */
  readonly adaptIcon = input.required<IconDescriptor>();
}
