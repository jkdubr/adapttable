/**
 * The export progress surface and the print button, through the toolbar slot.
 */
import type { ToolbarExtrasSlotProps } from "@adapttable/angular";
import type { ExportProgressState } from "@adapttable/core";
import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";

import {
  AdaptExportButton,
  AdaptPrintButton,
} from "./components/toolbarExtras";

const part = (name: string) =>
  document.querySelector<HTMLElement>(`[data-adapttable-part="${name}"]`);

const labels = {} as ToolbarExtrasSlotProps["labels"];

function props(progress: ExportProgressState | null): ToolbarExtrasSlotProps {
  return {
    density: "comfortable",
    onDensityChange: () => undefined,
    labels,
    onExportCsv: () => undefined,
    exportAnnouncement: "",
    exportProgressState: progress,
  };
}

const BUSY: ExportProgressState = {
  status: "busy",
  value: undefined,
  message: "Working",
  error: "",
  downloadUrl: undefined,
  onCancel: () => undefined,
  onRetry: undefined,
  onDismiss: undefined,
};

const FAILED: ExportProgressState = {
  status: "failed",
  value: 10,
  message: "",
  error: "Nope",
  downloadUrl: "blob:file",
  onCancel: undefined,
  onRetry: () => undefined,
  onDismiss: () => undefined,
};

@Component({
  imports: [AdaptExportButton],
  template: `<adapt-export-button [props]="props()" />`,
})
class ExportHost {
  readonly props = input.required<ToolbarExtrasSlotProps>();
}

@Component({
  imports: [AdaptPrintButton],
  template: `<adapt-print-button [props]="props()" />`,
})
class PrintHost {
  readonly props = input.required<ToolbarExtrasSlotProps>();
}

describe("export progress", () => {
  it("shows the bar while busy and the recovery actions after failure", () => {
    const cancel = vi.fn();
    const retry = vi.fn();
    const dismiss = vi.fn();
    const fixture = TestBed.createComponent(ExportHost);
    fixture.componentRef.setInput("props", {
      ...props({ ...BUSY, onCancel: cancel }),
    });
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();
    expect(part("export-progress-bar")?.getAttribute("value")).toBeNull();
    expect(part("export-progress-message")?.textContent).toContain("Working");
    expect(part("export-progress-cancel")).not.toBeNull();
    expect(part("export-progress-dismiss")).toBeNull();
    part("export-progress-cancel")!.click();
    expect(cancel).toHaveBeenCalledOnce();

    fixture.componentRef.setInput("props", {
      ...props({ ...BUSY, value: 40, message: "" }),
    });
    fixture.detectChanges();
    expect(part("export-progress-bar")?.getAttribute("value")).toBe("40");
    expect(part("export-progress-message")).toBeNull();

    fixture.componentRef.setInput("props", {
      ...props({ ...FAILED, onRetry: retry, onDismiss: dismiss }),
    });
    fixture.detectChanges();
    expect(part("export-progress-bar")).toBeNull();
    expect(part("export-progress-message")?.textContent).toContain("Nope");
    expect(part("export-progress-download")?.getAttribute("href")).toBe(
      "blob:file"
    );
    part("export-progress-retry")!.click();
    part("export-progress-dismiss")!.click();
    expect(retry).toHaveBeenCalledOnce();
    expect(dismiss).toHaveBeenCalledOnce();
  });
});

describe("AdaptPrintButton", () => {
  it("renders only when printing is a toolbar action", () => {
    const hidden = TestBed.createComponent(PrintHost);
    hidden.componentRef.setInput("props", props(null));
    document.body.append(hidden.nativeElement);
    hidden.detectChanges();
    expect(part("print-button")).toBeNull();
    hidden.destroy();

    const shown = TestBed.createComponent(PrintHost);
    shown.componentRef.setInput("props", {
      ...props(null),
      onPrint: () => undefined,
      printLabel: "Print",
    });
    document.body.append(shown.nativeElement);
    shown.detectChanges();
    expect(part("print-button")?.textContent?.trim()).toBe("Print");
  });
});
