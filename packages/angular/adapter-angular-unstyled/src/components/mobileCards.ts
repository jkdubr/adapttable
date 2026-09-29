/**
 * The card list rendered in place of the table on narrow screens.
 */
import {
  AdaptAttrs,
  AdaptCell,
  AdaptSlot,
  type ColumnDef,
  EDITABLE_CELL,
  type EditableCellEditing,
  type EditableCellSlotProps,
  ROW_REORDER_BUTTONS,
  type RowReorderButtonsProps,
  type RowReorderState,
} from "@adapttable/angular";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import type { TableView } from "../dataTable";
import { AdaptRowActions } from "./rowActionButtons";

/**
 * The phone card list drawn with native elements.
 *
 * Editable fields go through the {@link EDITABLE_CELL} slot when editing is
 * composed, matching React's mobile cards.
 *
 * @internal
 */
@Component({
  selector: "adapt-mobile-cards",
  imports: [AdaptAttrs, AdaptCell, AdaptRowActions, AdaptSlot],
  templateUrl: "./mobileCards.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
})
export class AdaptMobileCards<TRow> {
  /** What the table renders from. */
  readonly view = input.required<TableView<TRow>>();
  /** A row's stable id. */
  readonly rowKey = input.required<(row: TRow) => string>();

  /** The mobile reorder-buttons slot. @internal */
  protected readonly reorderButtonsSlot = ROW_REORDER_BUTTONS;
  /** The editable-cell slot. @internal */
  protected readonly editableCellSlot = EDITABLE_CELL;

  private buttonsPropsCache = new Map<string, RowReorderButtonsProps<never>>();
  private buttonsPropsToken = "";
  private editablePropsCache = new Map<string, EditableCellSlotProps<never>>();
  private editablePropsToken = "";

  /**
   * A row's id, for `@for` to track rows by.
   *
   * @internal
   */
  protected rowId(row: TRow): string {
    return this.rowKey()(row);
  }

  /**
   * Props for the reorder buttons slot on one card. Cached per change-detection
   * token so AdaptSlot does not see a new object every tick.
   *
   * @internal
   */
  protected reorderButtonsProps(
    reorder: RowReorderState<TRow>,
    row: TRow,
    localIndex: number
  ): RowReorderButtonsProps<never> {
    const view = this.view();
    const windowStart = view.table.windowStart();
    const rowCount = view.table.source().rows.length;
    const token = [
      reorder.lifted?.rowId ?? "",
      String(reorder.overIndex ?? ""),
      reorder.overPosition ?? "",
      String(reorder.hostConfirmPending),
      reorder.announcement,
      String(windowStart),
      String(rowCount),
      reorder.pendingMove ? "1" : "0",
    ].join("|");
    if (token !== this.buttonsPropsToken) {
      this.buttonsPropsCache = new Map();
      this.buttonsPropsToken = token;
    }
    const key = `${this.rowId(row)}:${String(localIndex)}`;
    const cached = this.buttonsPropsCache.get(key);
    if (cached) return cached;
    const props = {
      reorder,
      labels: view.table.labels(),
      localIndex,
      row,
      windowStart,
      rowCount,
    } as unknown as RowReorderButtonsProps<never>;
    this.buttonsPropsCache.set(key, props);
    return props;
  }

  /**
   * Props for the editable-cell slot on one card field. Cached so AdaptSlot
   * does not see a new object every tick.
   *
   * @internal
   */
  protected editableCellProps(
    editing: EditableCellEditing<TRow>,
    row: TRow,
    column: ColumnDef<TRow>,
    rowIndex: number
  ): EditableCellSlotProps<never> {
    const view = this.view();
    const labels = view.table.labels();
    const active = editing.state.active;
    const token = [
      active ? `${active.rowId}:${active.columnKey}` : "",
      editing.state.draft,
      String(view.table.rows().length),
      String(view.table.columns().length),
    ].join("|");
    if (token !== this.editablePropsToken) {
      this.editablePropsCache = new Map();
      this.editablePropsToken = token;
    }
    const rowId = this.rowId(row);
    const key = `${rowId}:${column.key}`;
    const cached = this.editablePropsCache.get(key);
    if (cached) return cached;
    const props = {
      editing,
      row,
      column,
      rowId,
      rowIndex,
      rows: view.table.rows(),
      columns: view.table.columns(),
      rowKey: (entry: TRow) => this.rowKey()(entry),
      editLabel: labels.editCell,
      undoLabel: labels.undoEdit,
    } as unknown as EditableCellSlotProps<never>;
    this.editablePropsCache.set(key, props);
    return props;
  }
}
