/**
 * The card list rendered in place of the table on narrow screens.
 */
import {
  AdaptAttrs,
  AdaptCell,
  AdaptRowDetail,
  AdaptSlot,
  type ColumnDef,
  EDITABLE_CELL,
  EXPAND_TOGGLE,
  GROUP_HEADER_CARD,
  mobileCardListStyle,
  resolveMobileLabel,
  ROW_EDIT_ACTIONS,
  ROW_REORDER_BUTTONS,
  type RowReorderButtonsProps,
  type RowReorderState,
  TREE_TOGGLE,
  treeCardStyle,
  type TreeToggleProps,
} from "@adapttable/angular";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  input,
  viewChild,
} from "@angular/core";

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
  imports: [AdaptAttrs, AdaptCell, AdaptRowActions, AdaptRowDetail, AdaptSlot],
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
  /** The row-edit-actions slot. @internal */
  protected readonly rowEditActionsSlot = ROW_EDIT_ACTIONS;
  /** The group header slot. @internal */
  protected readonly groupHeaderCardSlot = GROUP_HEADER_CARD;
  /** The row-expansion toggle slot. @internal */
  protected readonly expandToggleSlot = EXPAND_TOGGLE;
  /** The tree disclosure slot. @internal */
  protected readonly treeToggleSlot = TREE_TOGGLE;

  /**
   * Each tree card's disclosure props and indent, keyed by row id, while
   * the rows are a tree.
   *
   * @internal
   */
  protected readonly treeCards = computed(() => {
    const view = this.view();
    const tree = view.tree?.();
    const cards = new Map<
      string,
      {
        readonly toggle: TreeToggleProps<never>;
        readonly indent: string | null;
      }
    >();
    if (!tree) return cards;
    const labels = view.table.labels();
    for (const entry of tree.entries) {
      cards.set(entry.key, {
        // Slot props erase the row type: core types every slot's row as
        // `never`.
        toggle: {
          entry,
          labels,
          onToggle: tree.expansion.toggle,
        } as unknown as TreeToggleProps<never>,
        indent: treeCardStyle(entry.level).marginInlineStart ?? null,
      });
    }
    return cards;
  });

  private buttonsPropsCache = new Map<string, RowReorderButtonsProps<never>>();
  private buttonsPropsToken = "";

  /**
   * Cap the card list's height; the list scrolls inside the cap and a
   * composed {@link virtualize} tracks the list instead of the page.
   */
  readonly maxHeight = input<number | string>();

  /**
   * The card list, which scrolls itself when its height is capped.
   *
   * @internal
   */
  protected readonly scrollBox =
    viewChild<ElementRef<HTMLElement>>("scrollBox");

  /**
   * The scroll element virtualization tracks on phones, when present.
   *
   * @internal
   */
  scrollElement(): HTMLElement | null {
    return this.scrollBox()?.nativeElement ?? null;
  }

  /**
   * The list's cap, from core's card-list rule.
   *
   * @internal
   */
  protected readonly listStyle = computed(() => {
    const maxHeight = this.maxHeight();
    if (typeof maxHeight === "string") {
      return { maxHeight, overflowY: "auto" };
    }
    const style = mobileCardListStyle(maxHeight);
    return style
      ? { maxHeight: `${String(style.maxHeight)}px`, overflowY: "auto" }
      : null;
  });

  /**
   * A field's caption: its `mobileLabel`, else a string header, else its
   * key; an empty `mobileLabel` shows none.
   *
   * @internal
   */
  protected caption(column: ColumnDef<TRow>): string | undefined {
    return resolveMobileLabel(column);
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
}
