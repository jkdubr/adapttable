/**
 * The export progress surface's words and actions, and returning focus to
 * the export button on dismiss.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExportProgressState } from "./exportController";
import {
  exportProgressHeading,
  exportProgressView,
  focusExportTrigger,
} from "./exportProgressView";

const state = (
  overrides: Partial<ExportProgressState> = {}
): ExportProgressState => ({
  status: "busy",
  value: undefined,
  message: "",
  error: "",
  downloadUrl: undefined,
  onCancel: undefined,
  onRetry: undefined,
  onDismiss: undefined,
  ...overrides,
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("exportProgressHeading", () => {
  it("names each status, localized or in English", () => {
    expect(exportProgressHeading("busy", {})).toBe("Preparing export");
    expect(exportProgressHeading("done", {})).toBe("Export complete");
    expect(exportProgressHeading("failed", {})).toBe("Export failed");
    expect(exportProgressHeading("cancelled", {})).toBe("Export cancelled");
    expect(
      exportProgressHeading("busy", { exportStarted: "Préparation" })
    ).toBe("Préparation");
    expect(exportProgressHeading("done", { exportDone: "Fini" })).toBe("Fini");
    expect(exportProgressHeading("failed", { exportFailed: "Échec" })).toBe(
      "Échec"
    );
    expect(
      exportProgressHeading("cancelled", { exportCancelled: "Annulé" })
    ).toBe("Annulé");
  });
});

describe("exportProgressView", () => {
  it("describes an indeterminate busy run with its cancel", () => {
    const onCancel = vi.fn();
    const view = exportProgressView(state({ onCancel }), {});
    expect(view).toMatchObject({
      status: "busy",
      heading: "Preparing export",
      progress: undefined,
      progressLabel: "Preparing export",
      retry: undefined,
      dismiss: undefined,
      download: undefined,
    });
    expect(view.cancel?.label).toBe("Cancel");
    view.cancel?.onAction();
    expect(onCancel).toHaveBeenCalled();
  });

  it("reports progress, localized or in English", () => {
    expect(exportProgressView(state({ value: 40 }), {}).progressLabel).toBe(
      "Export 40% complete"
    );
    const view = exportProgressView(state({ value: 40 }), {
      exportProgress: (value) => `${String(value)} %`,
      exportStarted: "Start",
    });
    expect(view.progress).toBe(40);
    expect(view.progressLabel).toBe("40 %");
    expect(
      exportProgressView(state({ value: undefined }), {
        exportStarted: "Start",
      }).progressLabel
    ).toBe("Start");
  });

  it("hides the progress once the run is over and offers retry", () => {
    const onRetry = vi.fn();
    const view = exportProgressView(
      state({ status: "failed", value: 50, error: "boom", onRetry }),
      { retry: "Encore" }
    );
    expect(view.progress).toBeUndefined();
    expect(view.error).toBe("boom");
    expect(view.retry?.label).toBe("Encore");
    expect(
      exportProgressView(state({ status: "failed", onRetry }), {}).retry?.label
    ).toBe("Retry");
    expect(
      exportProgressView(state({ onCancel: vi.fn() }), { cancel: "Stop" })
        .cancel?.label
    ).toBe("Stop");
  });

  it("offers the download and a dismiss that returns focus", () => {
    const button = document.createElement("button");
    button.setAttribute("data-adapttable-part", "export-csv-button");
    document.body.append(button);
    const onDismiss = vi.fn();
    const view = exportProgressView(
      state({
        status: "done",
        downloadUrl: "https://example.test/file.csv",
        onDismiss,
      }),
      {}
    );
    expect(view.download).toEqual({
      url: "https://example.test/file.csv",
      label: "Download export",
    });
    expect(view.dismiss?.label).toBe("Dismiss");
    view.dismiss?.onAction();
    expect(onDismiss).toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
    const localized = exportProgressView(
      state({ status: "done", downloadUrl: "u", onDismiss }),
      { exportDismiss: "Fermer", exportDownload: "Télécharger" }
    );
    expect(localized.dismiss?.label).toBe("Fermer");
    expect(localized.download?.label).toBe("Télécharger");
  });
});

describe("focusExportTrigger", () => {
  it("finds the button around or inside the part", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("data-adapttable-part", "export-csv-button");
    const inner = document.createElement("button");
    wrapper.append(inner);
    document.body.append(wrapper);
    expect(focusExportTrigger()).toBe(true);
    expect(document.activeElement).toBe(inner);

    const outer = document.createElement("button");
    const part = document.createElement("span");
    part.setAttribute("data-adapttable-part", "export-csv-button");
    outer.append(part);
    const root = document.createElement("div");
    root.append(outer);
    document.body.append(root);
    expect(focusExportTrigger(root)).toBe(true);
    expect(document.activeElement).toBe(outer);
  });

  it("focuses the part itself when there is no button", () => {
    const part = document.createElement("div");
    part.tabIndex = 0;
    part.setAttribute("data-adapttable-part", "export-csv-button");
    document.body.append(part);
    expect(focusExportTrigger()).toBe(true);
    expect(document.activeElement).toBe(part);
  });

  it("does nothing without a part", () => {
    expect(focusExportTrigger()).toBe(false);
  });
});
