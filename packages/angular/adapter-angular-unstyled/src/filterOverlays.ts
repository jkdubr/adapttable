/**
 * Where the filters show: the anchored popover (the default, no backdrop),
 * the slide-in drawer (a real backdrop), the chips for what is active, the
 * form both overlays hold, and the funnel on a column header — each a slot
 * component this kit draws with native elements.
 */
import {
  type ActiveFilterChipsSlotProps,
  AdaptFilterTreeChrome,
  AdaptIcon,
  bindHeaderFilterDismiss,
  type FilterHeaderControlProps,
  filterLabel,
  type FilterOverlaySlotProps,
  FILTERS_ICON,
  type FiltersFormSlotProps,
  hasActiveHeaderFilter,
  type TableSource,
  watchOverlayDismiss,
} from "@adapttable/angular";
import { NgTemplateOutlet } from "@angular/common";
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  Injector,
  input,
  signal,
  type TemplateRef,
  viewChild,
} from "@angular/core";

import { TREE_SLOTS } from "./filterControls";
import { AdaptAutoFilterForm } from "./filterFields";
import { OVERLAY_Z, placeOverlayBelowTrigger } from "./overlay";

/** An overlay's props in Angular: its content is a template. */
type OverlayProps = FilterOverlaySlotProps<TemplateRef<unknown>>;

/**
 * The filters form both overlays hold: the nested AND/OR builder, then the
 * simple fields.
 *
 * @internal
 */
@Component({
  selector: "adapt-filters-form",
  imports: [AdaptAutoFilterForm, AdaptFilterTreeChrome],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = props();
    <div
      data-adapttable-part="filters-form"
      style="display: flex; flex-direction: column; gap: 16px"
    >
      <adapt-filter-tree-chrome
        [defs]="p.defs"
        [source]="p.source"
        [labels]="p.labels"
        [registry]="p.registry"
        [defaultExpanded]="p.defaultExpanded ?? false"
        [slots]="treeSlots"
      />
      @if (p.showSimpleFields) {
        <adapt-auto-filter-form
          [defs]="p.defs"
          [source]="p.source"
          [labels]="p.labels"
          [registry]="p.registry"
        />
      }
    </div>
  `,
})
export class AdaptFiltersForm {
  /** The slot's props. */
  readonly props = input.required<FiltersFormSlotProps<never>>();

  protected readonly treeSlots = TREE_SLOTS;
}

/**
 * The anchored filter card: opens under the Filters button with no
 * backdrop, closes on an outside click or Escape, and hands focus back to
 * the button on Escape.
 *
 * @internal
 */
@Component({
  selector: "adapt-filter-popover",
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = props();
    <span
      #anchor
      data-adapttable-part="filters-anchor"
      style="position: relative; display: inline-flex"
    >
      @if (p.children; as trigger) {
        <ng-container [ngTemplateOutlet]="trigger" />
      }
      @if (p.open) {
        <div
          #card
          data-adapttable-part="filters-popover"
          [attr.dir]="p.dir ?? 'ltr'"
          [attr.data-dir]="p.dir ?? 'ltr'"
          [style.position]="'fixed'"
          [style.z-index]="zIndex"
          [style.width.px]="380"
          [style.max-width]="'calc(100vw - 16px)'"
          [style.overflow-y]="'auto'"
        >
          <header data-adapttable-part="filters-header">
            <h3 data-adapttable-part="filters-title">
              {{ p.labels.filters
              }}{{
                p.activeFilterCount > 0 ? " (" + p.activeFilterCount + ")" : ""
              }}
            </h3>
            <button
              type="button"
              data-adapttable-part="filters-clear"
              [disabled]="p.activeFilterCount === 0"
              (click)="p.onClearFilters()"
            >
              {{ p.labels.clearAll }}
            </button>
          </header>
          <div data-adapttable-part="filters-body">
            <ng-container [ngTemplateOutlet]="p.filters" />
          </div>
        </div>
      }
    </span>
  `,
})
export class AdaptFilterPopover {
  /** The slot's props. */
  readonly props = input.required<OverlayProps>();

  protected readonly zIndex = OVERLAY_Z;
  private readonly anchor =
    viewChild.required<ElementRef<HTMLElement>>("anchor");
  private readonly card = viewChild<ElementRef<HTMLElement>>("card");

  constructor() {
    effect((onCleanup) => {
      const { open, onClose } = this.props();
      if (!open) return;
      const onClick = (event: MouseEvent): void => {
        const target = event.target as Node;
        if (!document.contains(target)) return;
        if (this.anchor().nativeElement.contains(target)) return;
        const card = this.card()?.nativeElement;
        if (card?.contains(target) || card?.contains(document.activeElement)) {
          return;
        }
        onClose();
      };
      const onKey = (event: KeyboardEvent): void => {
        if (event.key !== "Escape") return;
        onClose();
        this.anchor().nativeElement.querySelector("button")?.focus();
      };
      document.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
      onCleanup(() => {
        document.removeEventListener("click", onClick);
        document.removeEventListener("keydown", onKey);
      });
    });

    afterRenderEffect((onCleanup) => {
      const card = this.card()?.nativeElement;
      const { open, dir } = this.props();
      if (!open || !card) return;
      const place = (): void => {
        placeOverlayBelowTrigger(
          card,
          this.anchor().nativeElement,
          dir ?? "ltr"
        );
      };
      place();
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, true);
      onCleanup(() => {
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", place, true);
      });
    });
  }
}

/** What focus can land on inside the drawer. */
const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The slide-in filters drawer: a backdrop that dims and blocks the page, a
 * dialog that keeps focus inside it, and Escape or the backdrop to close.
 *
 * @internal
 */
@Component({
  selector: "adapt-filter-drawer",
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = props();
    @if (p.open) {
      <button
        type="button"
        data-adapttable-part="filters-backdrop"
        data-state="open"
        [attr.aria-label]="p.labels.cancel"
        (click)="p.onClose()"
      ></button>
      <dialog
        #panel
        open
        tabindex="-1"
        aria-modal="true"
        data-adapttable-part="filters-panel"
        data-state="open"
        [attr.aria-label]="p.labels.filters"
        [attr.dir]="p.dir ?? 'ltr'"
        [attr.data-dir]="p.dir ?? 'ltr'"
        style="position: fixed; inset-block: 0; inset-inline-end: 0; inset-inline-start: auto; margin: 0; max-height: none; max-width: none; height: 100%; z-index: 200"
      >
        <header data-adapttable-part="filters-header">
          <h3 data-adapttable-part="filters-title">
            {{ p.labels.filters
            }}{{
              p.activeFilterCount > 0 ? " (" + p.activeFilterCount + ")" : ""
            }}
          </h3>
          <button
            type="button"
            data-adapttable-part="filters-close"
            [attr.aria-label]="p.labels.cancel"
            (click)="p.onClose()"
          >
            ×
          </button>
        </header>
        <div data-adapttable-part="filters-body">
          <ng-container [ngTemplateOutlet]="p.filters" />
        </div>
        <footer data-adapttable-part="filters-footer">
          <button
            type="button"
            data-adapttable-part="filters-clear"
            [disabled]="p.activeFilterCount === 0"
            (click)="p.onClearFilters()"
          >
            {{ p.labels.clearAll }}
          </button>
          <button
            type="button"
            data-adapttable-part="filters-done"
            (click)="p.onClose()"
          >
            {{ p.labels.filtersDone }}
          </button>
        </footer>
      </dialog>
    }
  `,
})
export class AdaptFilterDrawer {
  /** The slot's props. */
  readonly props = input.required<OverlayProps>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>("panel");

  constructor() {
    afterRenderEffect((onCleanup) => {
      const panel = this.panel()?.nativeElement;
      const { open, onClose } = this.props();
      if (!open || !panel) return;
      const trigger =
        document.activeElement instanceof HTMLElement &&
        !panel.contains(document.activeElement)
          ? document.activeElement
          : null;
      panel.focus();
      const onKey = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
          onClose();
          return;
        }
        if (event.key === "Tab") trapTab(event, panel);
      };
      document.addEventListener("keydown", onKey);
      onCleanup(() => {
        document.removeEventListener("keydown", onKey);
        trigger?.focus();
      });
    });
  }
}

/** Keep Tab and Shift+Tab inside the panel. */
function trapTab(event: KeyboardEvent, panel: HTMLElement): void {
  const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === panel)) {
    event.preventDefault();
    last.focus();
  } else if (
    (!event.shiftKey && active === last) ||
    (active !== null && !panel.contains(active))
  ) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * The chips for every active filter, each removable, and a clear-all.
 *
 * @internal
 */
@Component({
  selector: "adapt-filter-chips",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = props();
    @if (p.chips.length > 0) {
      <ul data-adapttable-part="chips" [attr.aria-label]="p.labels.filters">
        @for (chip of p.chips; track chip.key) {
          <li data-adapttable-part="chip">
            {{ chip.label }}
            <button
              type="button"
              data-adapttable-part="chip-remove"
              [attr.aria-label]="p.labels.removeFilter(chip.label)"
              (click)="chip.onRemove()"
            >
              ×
            </button>
          </li>
        }
        <li data-adapttable-part="chip">
          <button
            type="button"
            data-adapttable-part="chip-remove"
            (click)="p.onClearAll()"
          >
            {{ p.labels.clearAll }}
          </button>
        </li>
      </ul>
    }
  `,
})
export class AdaptFilterChips {
  /** The slot's props. */
  readonly props = input.required<ActiveFilterChipsSlotProps>();
}

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
