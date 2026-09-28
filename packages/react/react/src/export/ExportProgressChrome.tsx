import type { TableLabels } from "@adapttable/core";
import type {
  ExportProgressChromeProps as NeutralExportProgressChromeProps,
  ExportProgressSlots as NeutralExportProgressSlots,
} from "@adapttable/core/binding";
import type { ReactElement, ReactNode } from "react";

import type { ExportStatus } from "./useExportHandler";

export type {
  ExportProgressAction,
  ExportProgressDownload,
  ExportProgressSurfaceSlotProps,
} from "@adapttable/core/binding";

/**
 * Required adapter components for {@link ExportProgressChrome} —
 * `@adapttable/core`'s `ExportProgressSlots` drawing React nodes.
 *
 * @public
 */
export type ExportProgressSlots = NeutralExportProgressSlots<ReactNode>;

/**
 * Props for {@link ExportProgressChrome} — `@adapttable/core`'s
 * `ExportProgressChromeProps` with React's slots.
 *
 * @public
 */
export type ExportProgressChromeProps =
  NeutralExportProgressChromeProps<ReactNode>;

/**
 * Convert shared export lifecycle state into one kit-owned visible surface.
 *
 * Core owns when the surface exists, which actions are legal, and every
 * localized string. The adapter owns all visible controls and styling.
 *
 * @public
 */
export function ExportProgressChrome({
  progress,
  labels,
  slots,
}: Readonly<ExportProgressChromeProps>): ReactElement | null {
  if (!progress) return null;
  const Surface = slots.Surface;
  return (
    <Surface
      status={progress.status}
      heading={headingFor(progress.status, labels)}
      message={progress.message}
      error={progress.error}
      progress={progress.status === "busy" ? progress.value : undefined}
      progressLabel={
        progress.value === undefined
          ? (labels.exportStarted ?? "Preparing export")
          : (labels.exportProgress?.(progress.value) ??
            `Export ${String(progress.value)}% complete`)
      }
      cancel={
        progress.onCancel
          ? {
              label: labels.cancel ?? "Cancel",
              onAction: progress.onCancel,
            }
          : undefined
      }
      retry={
        progress.onRetry
          ? {
              label: labels.retry ?? "Retry",
              onAction: progress.onRetry,
            }
          : undefined
      }
      dismiss={
        progress.onDismiss
          ? {
              label: labels.exportDismiss ?? "Dismiss",
              onAction: () => {
                progress.onDismiss?.();
                focusExportTrigger();
              },
            }
          : undefined
      }
      download={
        progress.downloadUrl
          ? {
              url: progress.downloadUrl,
              label: labels.exportDownload ?? "Download export",
            }
          : undefined
      }
    />
  );
}

const EXPORT_CSV_BUTTON_PART = "export-csv-button";

function focusExportTrigger(): void {
  const named = document.querySelector<HTMLElement>(
    `[data-adapttable-part=${JSON.stringify(EXPORT_CSV_BUTTON_PART)}]`
  );
  if (!named) return;
  // Kits sometimes put the part on a wrapper; the control that started the
  // export is the nearest button, which is also what a keyboard user returns to.
  const trigger =
    named.closest("button") ?? named.querySelector("button") ?? named;
  trigger.focus();
}

function headingFor(
  status: Exclude<ExportStatus, "idle">,
  labels: TableLabels
) {
  if (status === "busy") return labels.exportStarted ?? "Preparing export";
  if (status === "done") return labels.exportDone ?? "Export complete";
  if (status === "failed") return labels.exportFailed ?? "Export failed";
  return labels.exportCancelled ?? "Export cancelled";
}
