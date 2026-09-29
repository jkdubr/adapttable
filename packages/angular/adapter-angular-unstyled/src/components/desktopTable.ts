/**
 * The desktop table body: header, rows, reorder handles and cell editors.
 */
import {
  AdaptAttrs,
  AdaptCell,
  AdaptHeader,
  AdaptSlot,
  EDITABLE_CELL,
  FILTER_HEADER,
  ROW_EDIT_ACTIONS,
  ROW_REORDER_HANDLE,
  type RowReorderHandleProps,
  type RowReorderState,
} from "@adapttable/angular";
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  viewChild,
} from "@angular/core";

import type { TableView } from "../dataTable";
import { AdaptRowActions } from "./rowActionButtons";

/**
 * The desktop table drawn with native elements: sticky header, body rows,
 * selection, reorder and in-place cell editors.
 *
 * Editable cells go through the {@link EDITABLE_CELL} slot when editing is
 * composed; otherwise the column cell renders as usual.
 *
 * @internal
 */
@Component({
  selector: "adapt-desktop-table",
  imports: [AdaptAttrs, AdaptCell, AdaptHeader, AdaptRowActions, AdaptSlot],
  templateUrl: "./desktopTable.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
})
export class AdaptDesktopTable<TRow> {
  /** What the table renders from. */
  readonly view = input.required<TableView<TRow>>();
  /** A row's stable id. */
  readonly rowKey = input.required<(row: TRow) => string>();
  /**
   * Cap the table body's height; the body scrolls inside the box and a
   * composed {@link virtualize} tracks the box instead of the page.
   */
  readonly maxHeight = input<number | string>();

  /** The header-filter slot. @internal */
  protected readonly filterSlots = { header: FILTER_HEADER };
  /** The row-reorder grip slot. @internal */
  protected readonly reorderHandleSlot = ROW_REORDER_HANDLE;
  /** The editable-cell slot. @internal */
  protected readonly editableCellSlot = EDITABLE_CELL;
  /** The row-edit-actions slot. @internal */
  protected readonly rowEditActionsSlot = ROW_EDIT_ACTIONS;

  private handlePropsCache = new Map<string, RowReorderHandleProps<never>>();
  private handlePropsToken = "";

  /**
   * The scroll box that owns `maxHeight`, when virtualization tracks it.
   *
   * @internal
   */
  protected readonly scrollBox =
    viewChild<ElementRef<HTMLElement>>("scrollBox");

  /**
   * The scroll element virtualization tracks, when present.
   *
   * @internal
   */
  scrollElement(): HTMLElement | null {
    return this.scrollBox()?.nativeElement ?? null;
  }

  /**
   * A row's id, for `@for` to track rows by.
   *
   * @internal
   */
  protected rowId(row: TRow): string {
    return this.rowKey()(row);
  }

  /**
   * Props for the reorder grip slot on one body row. Cached per change-detection
   * token so AdaptSlot does not see a new object every tick.
   *
   * @internal
   */
  protected reorderHandleProps(
    reorder: RowReorderState<TRow>,
    row: TRow,
    localIndex: number
  ): RowReorderHandleProps<never> {
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
    if (token !== this.handlePropsToken) {
      this.handlePropsCache = new Map();
      this.handlePropsToken = token;
    }
    const rowId = this.rowId(row);
    const key = `${rowId}:${String(localIndex)}`;
    const cached = this.handlePropsCache.get(key);
    if (cached) return cached;
    const props = {
      reorder,
      labels: view.table.labels(),
      rowId,
      localIndex,
      row,
      windowStart,
      rowCount,
    } as unknown as RowReorderHandleProps<never>;
    this.handlePropsCache.set(key, props);
    return props;
  }

  /**
   * Style for the scroll box when `maxHeight` is set.
   *
   * @internal
   */
  protected scrollBoxStyle(): Record<string, string> | null {
    const maxHeight = this.maxHeight();
    if (maxHeight == null) return null;
    return {
      maxHeight:
        typeof maxHeight === "number" ? `${String(maxHeight)}px` : maxHeight,
      overflow: "auto",
    };
  }
}
