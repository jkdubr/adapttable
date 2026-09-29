/**
 * The card list rendered in place of the table on narrow screens.
 */
import { AdaptAttrs, AdaptCell } from "@adapttable/angular";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import type { TableView } from "../dataTable";
import { AdaptRowActions } from "./rowActionButtons";

/**
 * The phone card list drawn with native elements.
 *
 * @internal
 */
@Component({
  selector: "adapt-mobile-cards",
  imports: [AdaptAttrs, AdaptCell, AdaptRowActions],
  templateUrl: "./mobileCards.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
})
export class AdaptMobileCards<TRow> {
  /** What the table renders from. */
  readonly view = input.required<TableView<TRow>>();
  /** A row's stable id. */
  readonly rowKey = input.required<(row: TRow) => string>();

  /**
   * A row's id, for `@for` to track rows by.
   *
   * @internal
   */
  protected rowId(row: TRow): string {
    return this.rowKey()(row);
  }
}
