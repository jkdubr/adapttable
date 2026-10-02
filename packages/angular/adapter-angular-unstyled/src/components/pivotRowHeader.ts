/**
 * The pivot row-header cell: the part, the kind, and the indent.
 *
 * The binding's model stores the caption and the indent on the column. This
 * kit draws them. A host that wants a fold button replaces `column.cell`.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

/**
 * One body line's row header.
 *
 * @public
 */
@Component({
  selector: "adapt-pivot-row-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    data-adapttable-part="pivot-row-header"
    [attr.data-pivot-kind]="row().kind"
    [style.padding-inline-start]="pad()"
    >{{ text() }}</span
  >`,
})
export class AdaptPivotRowHeader {
  /** The pivot line. */
  readonly row = input.required<{
    readonly kind: string;
    readonly label: string;
    readonly depth: number;
  }>();
  /** The row-header column, carrying the caption and the indent. */
  readonly column = input.required<{ meta?: Record<string, unknown> }>();

  /** The line's caption, or its label when the column carries none. */
  protected readonly text = computed(() => {
    const caption = this.column().meta?.pivotCaption;
    return typeof caption === "function"
      ? (caption as (line: { readonly label: string }) => string)(this.row())
      : this.row().label;
  });

  /** Nesting, or nothing at the outermost line and when indent is off. */
  protected readonly pad = computed(() => {
    const indent = this.column().meta?.pivotIndent;
    const depth = this.row().depth;
    if (typeof indent !== "number" || depth <= 0 || indent <= 0) return null;
    return `${String(depth * indent)}px`;
  });
}
