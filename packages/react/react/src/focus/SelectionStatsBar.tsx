/** Headless selection-stat formatting; adapters own the visible status bar. */
import {
  type SelectionStatPart,
  selectionStatParts,
  type SelectionStats,
  type TableLabels,
} from "@adapttable/core";
import type { ReactNode } from "react";

export type { SelectionStatPart, SelectionStats };

/**
 * Props for {@link SelectionStatsChrome}.
 *
 * @public
 */
export interface SelectionStatsChromeProps {
  /** The statistics, straight from `shell.selectionStats`. */
  stats: SelectionStats | null;
  /** Labels for each figure; falls back to the built-in English. */
  labels?: TableLabels;
  /** Locale tag for number formatting. The host's default when omitted. */
  locale?: string;
  /** A kit's own class for the strip. */
  className?: string;
  /** Adapter-owned visible component. */
  slots: SelectionStatsSlots;
}

/**
 * Props passed to an adapter's selection-status component.
 *
 * @public
 */
export interface SelectionStatsSlotProps {
  /** The statistics to render, already formatted. */
  readonly parts: readonly SelectionStatPart[];
  /** Class for the element. */
  readonly className?: string;
}

/**
 * Adapter-owned rendering for {@link SelectionStatsChrome}.
 *
 * @public
 */
export interface SelectionStatsSlots {
  /** Renders the selection statistics. */
  readonly Stats: (props: SelectionStatsSlotProps) => ReactNode;
}

/**
 * Renders the selection statistics, or nothing at all when there is no
 * multi-cell selection — so an adapter renders it unconditionally and the
 * opt-in promise still holds.
 *
 * The strip is a status region: a screen reader reads the new figures after
 * the range announcement rather than interrupting it, which is the order the
 * two belong in.
 *
 * @public
 */
export function SelectionStatsChrome({
  stats,
  labels,
  locale,
  className,
  slots,
}: Readonly<SelectionStatsChromeProps>): ReactNode {
  const parts = selectionStatParts(stats, labels, locale);
  if (!parts) return null;
  const Stats = slots.Stats;
  return <Stats parts={parts} className={className} />;
}
