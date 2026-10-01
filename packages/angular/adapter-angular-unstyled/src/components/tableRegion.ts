/**
 * The flex row a side panel sits in, beside the table's body.
 *
 * Absent a panel, the body is projected unchanged: the region exists only
 * while something is beside it, so a table with no panel does not grow a
 * layout wrapper.
 */
import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  type TemplateRef,
} from "@angular/core";

/**
 * Place a panel beside the table body.
 *
 * @public
 */
@Component({
  selector: "adapt-table-region",
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #body><ng-content /></ng-template>
    @if (panel(); as panel) {
      <div
        data-adapttable-part="table-region"
        style="display: flex; gap: 12px; align-items: flex-start"
        [style.flex-direction]="side() === 'start' ? 'row-reverse' : 'row'"
      >
        <div
          data-adapttable-part="table-region-main"
          style="flex: 1; min-width: 0"
        >
          <ng-container [ngTemplateOutlet]="body" />
        </div>
        <ng-container [ngTemplateOutlet]="panel" />
      </div>
    } @else {
      <ng-container [ngTemplateOutlet]="body" />
    }
  `,
})
export class AdaptTableRegion {
  /** The panel beside the body. Absent, the body stands alone. */
  readonly panel = input<TemplateRef<unknown>>();
  /** Which edge the panel sits on. */
  readonly side = input<"start" | "end">("end");
}
