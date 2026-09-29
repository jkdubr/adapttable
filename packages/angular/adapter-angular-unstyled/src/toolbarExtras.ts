/**
 * The toolbar's optional controls, drawn natively. Each renders through the
 * toolbar-extras slot, so a table that never composes a feature carries
 * neither its handler nor its button.
 */
import {
  AdaptLiveRegion,
  type ToolbarExtrasSlotProps,
} from "@adapttable/angular";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** Switches between comfortable and compact rows. @internal */
@Component({
  selector: "adapt-density-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let p = props();
    <button
      type="button"
      data-adapttable-part="density-toggle"
      [attr.aria-label]="p.labels.density"
      (click)="
        p.onDensityChange(p.density === 'compact' ? 'comfortable' : 'compact')
      "
    >
      {{
        p.density === "compact"
          ? p.labels.densityCompact
          : p.labels.densityComfortable
      }}
    </button>
  `,
})
export class AdaptDensityButton {
  /** The slot's props. */
  readonly props = input.required<ToolbarExtrasSlotProps>();
}

/** Takes the table fullscreen, and back. @internal */
@Component({
  selector: "adapt-fullscreen-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let p = props();
    @if (p.onToggleFullscreen; as toggle) {
      <button
        type="button"
        data-adapttable-part="fullscreen-toggle"
        [attr.aria-label]="
          p.isFullscreen ? p.labels.exitFullscreen : p.labels.enterFullscreen
        "
        (click)="toggle()"
      >
        {{ p.isFullscreen ? "✕" : "⛶" }}
      </button>
    }
  `,
})
export class AdaptFullscreenButton {
  /** The slot's props. */
  readonly props = input.required<ToolbarExtrasSlotProps>();
}

/** Exports the current view, and says how it went. @internal */
@Component({
  selector: "adapt-export-button",
  imports: [AdaptLiveRegion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let p = props();
    @if (p.onExportCsv; as start) {
      <button
        type="button"
        data-adapttable-part="export-csv-button"
        style="flex-shrink: 0; white-space: nowrap"
        [disabled]="p.exportBusy === true || p.exportDisabled === true"
        [attr.aria-busy]="p.exportBusy ?? null"
        [attr.title]="p.exportDisabled ? p.exportDisabledReason : null"
        (click)="start()"
      >
        @if (p.exportBusy) {
          <span aria-hidden="true" data-adapttable-part="export-spinner"></span>
        }
        {{ p.exportLabel }}
      </button>
      <output
        [adaptLiveRegion]="p.exportAnnouncement ?? ''"
        part="export-announcer"
      ></output>
    }
  `,
})
export class AdaptExportButton {
  /** The slot's props. */
  readonly props = input.required<ToolbarExtrasSlotProps>();
}
