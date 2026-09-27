import {
  type ExportProgressAction,
  type ExportProgressDownload,
  exportProgressView,
  type TableLabels,
} from "@adapttable/core";
import type { ReactElement, ReactNode } from "react";

import type { ExportProgressState, ExportStatus } from "./useExportHandler";

export type {
  ExportProgressAction,
  ExportProgressDownload,
} from "@adapttable/core";

/**
 * Props for an adapter-owned server-export progress surface.
 *
 * @public
 */
export interface ExportProgressSurfaceSlotProps {
  /** Busy, done, failed, or cancelled. */
  readonly status: Exclude<ExportStatus, "idle">;
  /** Localized surface heading. */
  readonly heading: string;
  /** Host-provided progress detail. */
  readonly message: string;
  /** Rejection detail, present only after failure. */
  readonly error: string;
  /** Completion from 0 through 100; absent means indeterminate while busy. */
  readonly progress: number | undefined;
  /** Accessible text for the progress indicator. */
  readonly progressLabel: string;
  /** Cancel action while busy. */
  readonly cancel: ExportProgressAction | undefined;
  /** Retry action after failure. */
  readonly retry: ExportProgressAction | undefined;
  /** Dismiss action after done, failed, or cancelled. */
  readonly dismiss: ExportProgressAction | undefined;
  /** Download link after a URL settlement. */
  readonly download: ExportProgressDownload | undefined;
}

/**
 * Required adapter components for {@link ExportProgressChrome}.
 *
 * @public
 */
export interface ExportProgressSlots {
  /** Renders the kit-native surface, progress indicator, and actions. */
  readonly Surface: (props: ExportProgressSurfaceSlotProps) => ReactNode;
}

/**
 * Props for {@link ExportProgressChrome}.
 *
 * @public
 */
export interface ExportProgressChromeProps {
  /** Shared export lifecycle state, or null for browser-built exports. */
  readonly progress: ExportProgressState | null;
  /** Resolved table labels. */
  readonly labels: TableLabels;
  /** Adapter-owned visible components. */
  readonly slots: ExportProgressSlots;
}

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
  return <Surface {...exportProgressView(progress, labels)} />;
}
