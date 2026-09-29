/**
 * The funnel on a column's header: opens that column's filter field under
 * the header, and closes on an outside press or once a single-control write
 * finishes, when the table asks for that.
 */
import {
  AdaptIcon,
  bindHeaderFilterDismiss,
  type FilterHeaderControlProps,
  filterLabel,
  FILTERS_ICON,
  hasActiveHeaderFilter,
  type TableSource,
  watchOverlayDismiss,
} from "@adapttable/angular";
import { AdaptAutoFilterForm } from "@adapttable/angular-unstyled";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  signal,
} from "@angular/core";

let nextSession = 0;

/** A fresh id that marks what counts as inside one header filter. */
function sessionId(): string {
  nextSession += 1;
  return String(nextSession);
}

/**
 * The funnel on a column's header: opens that column's filter field under
 * the header, and closes on an outside press or once a single-control write
 * finishes, when the table asks for that.
 *
 * @internal
 */
@Component({
  selector: "adapt-header-filter-trigger",
  imports: [AdaptAutoFilterForm, AdaptIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = props();
    <details
      data-adapttable-part="filter-header-trigger"
      style="position: relative; display: inline-block"
      [attr.data-adapttable-header-filter]="session"
      [open]="open()"
      (toggle)="open.set($any($event.target).open)"
    >
      <summary
        style="list-style: none; cursor: pointer; display: inline-flex; align-items: center; padding: 2px"
        [attr.aria-label]="caption()"
        [attr.data-active]="active() ? '' : null"
      >
        <svg [adaptIcon]="icon"></svg>
      </summary>
      @if (open()) {
        <div
          data-adapttable-part="filter-header-cell"
          style="position: absolute; z-index: 3; inset-inline-start: 0; top: 100%; min-width: 20rem; padding: 0.5rem; background: Canvas; color: CanvasText; border: 1px solid currentColor"
        >
          <adapt-auto-filter-form
            [defs]="[p.def]"
            [source]="source()"
            [labels]="p.labels"
            [registry]="p.registry ?? registry"
          />
        </div>
      }
    </details>
  `,
})
export class AdaptHeaderFilterTrigger {
  /** The slot's props. */
  readonly props = input.required<FilterHeaderControlProps<never>>();

  protected readonly icon = { ...FILTERS_ICON, width: 14, height: 14 };
  protected readonly session = sessionId();
  protected readonly open = signal(false);
  protected readonly registry = undefined as never;
  protected readonly caption = computed(() => filterLabel(this.props().def));
  protected readonly active = computed(() =>
    hasActiveHeaderFilter(this.props())
  );
  /** The source, closing the field after a finished write when asked. */
  protected readonly source = computed(
    () =>
      bindHeaderFilterDismiss(this.props().source, {
        def: this.props().def,
        closeOnSelect: this.props().closeOnSelect === true,
        dismiss: () => {
          this.open.set(false);
        },
        registry: this.props().registry,
      }) as TableSource<never>
  );

  constructor() {
    const injector = inject(Injector);
    effect(
      (onCleanup) => {
        if (!this.open()) return;
        onCleanup(
          watchOverlayDismiss(
            document,
            `[data-adapttable-header-filter="${this.session}"]`,
            () => {
              this.open.set(false);
            }
          )
        );
      },
      { injector }
    );
  }
}
