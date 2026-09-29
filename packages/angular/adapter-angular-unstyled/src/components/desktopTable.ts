/**
 * The desktop table body: header, rows, reorder handles and cell editors.
 */
import {
  AdaptAttrs,
  AdaptCell,
  AdaptHeader,
  AdaptSlot,
  beginCellEdit,
  type ColumnDef,
  FILTER_HEADER,
  parseCellEditValue,
  resolveCellEditor,
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

  /**
   * Open the in-place editor for a cell when editing is composed.
   *
   * @internal
   */
  protected beginEdit(row: TRow, column: ColumnDef<TRow>): void {
    const view = this.view();
    if (!view.editing || !view.onCellEdit) return;
    beginCellEdit(view.editing(), row, column, (entry) => this.rowKey()(entry));
  }

  /**
   * Commit the active draft through the host's write.
   *
   * @internal
   */
  protected commitEdit(): void {
    const view = this.view();
    if (!view.editing || !view.onCellEdit) return;
    const commit = view.editing().commit();
    if (!commit) return;
    const row = view.table
      .rows()
      .find((entry) => this.rowKey()(entry) === commit.rowId);
    const column = view.table
      .columns()
      .find((entry) => entry.key === commit.columnKey);
    if (!row || !column) return;
    const editor = resolveCellEditor(column);
    const value = editor
      ? parseCellEditValue(editor, commit.draft)
      : commit.draft;
    void view.onCellEdit(row, commit.columnKey, value);
  }

  /**
   * Abandon the active draft.
   *
   * @internal
   */
  protected cancelEdit(): void {
    this.view().editing?.().cancel();
  }
}
