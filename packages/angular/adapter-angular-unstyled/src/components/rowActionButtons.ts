/**
 * One row's actions: a strip of buttons, or a menu behind a "more" button.
 */
import {
  type ConfirmHandler,
  resolveDisabledReason,
  type RowAction,
  type RowActionsLayout,
  runRowAction,
  type TableLabels,
  visibleRowActions,
} from "@adapttable/angular";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  input,
  viewChild,
} from "@angular/core";

/**
 * One row's actions: a strip of buttons, or a menu behind a "more" button.
 *
 * @internal
 */
@Component({
  selector: "adapt-row-actions",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @if (layout() === "menu") {
      <details
        #menu
        data-adapttable-part="row-actions-menu"
        (pointerdown)="$event.stopPropagation()"
      >
        <summary
          data-adapttable-part="row-actions-trigger"
          [attr.aria-label]="labels().rowActionsMenu"
          (click)="$event.stopPropagation()"
        >
          ⋮
        </summary>
        @for (item of items(); track item.action.key) {
          <button
            type="button"
            data-adapttable-part="action-button"
            [attr.aria-label]="item.action.label"
            [attr.title]="item.reason ?? null"
            [attr.data-color]="item.action.color ?? null"
            [disabled]="item.disabled"
            (click)="run($event, item.action)"
          >
            {{ item.action.label }}
          </button>
        }
      </details>
    } @else {
      @for (item of items(); track item.action.key) {
        <button
          type="button"
          data-adapttable-part="action-button"
          [attr.aria-label]="item.action.label"
          [attr.title]="item.reason ?? null"
          [attr.data-color]="item.action.color ?? null"
          [disabled]="item.disabled"
          (click)="run($event, item.action)"
        >
          {{ item.action.label }}
        </button>
      }
    }
  `,
})
export class AdaptRowActions<TRow> {
  /** The row. */
  readonly row = input.required<TRow>();
  /** Its actions. */
  readonly actions = input.required<readonly RowAction<TRow>[]>();
  /** Asks before an action that declares a `confirm`. */
  readonly confirm = input.required<ConfirmHandler>();
  /** Resolved labels. */
  readonly labels = input.required<Required<TableLabels>>();
  /** A strip of buttons, or a menu. */
  readonly layout = input<RowActionsLayout | undefined>();

  private readonly menu = viewChild<ElementRef<HTMLDetailsElement>>("menu");

  protected readonly items = computed(() =>
    visibleRowActions(this.actions(), this.row()).map((action) => {
      const reason = resolveDisabledReason(action.disabledReason?.(this.row()));
      return {
        action,
        reason,
        disabled:
          reason !== undefined || (action.isDisabled?.(this.row()) ?? false),
      };
    })
  );

  protected run(event: Event, action: RowAction<TRow>): void {
    event.stopPropagation();
    this.menu()?.nativeElement.removeAttribute("open");
    runRowAction(action, this.row(), this.confirm(), this.labels().cancel);
  }
}
