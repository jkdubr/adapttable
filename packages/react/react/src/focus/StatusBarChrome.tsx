/**
 * The status bar: what the table is showing, and what is selected.
 *
 * A spreadsheet puts this at the bottom of the window and a user checks it
 * without thinking — how many rows are here, how many did I select, what do
 * they add up to. The table already knows all three; until now nothing put
 * them in one place, and a host that wanted the strip had to assemble it
 * from the source, the selection and `selectionStats` by hand.
 *
 * The arithmetic is not repeated here. Row counts come from the source's
 * own paging figures, the selected count from the selection, and the
 * sums from {@link SelectionStatsChrome}, which stays the one place that
 * knows what "average of a column of nulls" means. This composes them and
 * owns the structure: order, part names, and the live region that tells a
 * screen-reader user the selection changed.
 *
 * Everything visible is a slot. The strip is a row of text in every kit and
 * a row of text is still that kit's text — its muted colour, its numeric
 * font, its spacing — so core supplies no markup for it.
 */
import {
  type FeatureNotice,
  type SelectionStats,
  type StatusBarItem,
  statusBarItems,
  type TableLabels,
} from "@adapttable/core";
import type { ReactNode } from "react";

export type {
  FeatureNotice,
  FeatureNoticeKind,
  StatusBarItem,
} from "@adapttable/core";

import {
  SelectionStatsChrome,
  type SelectionStatsSlots,
} from "./SelectionStatsBar";

/**
 * Props an adapter's status-bar component receives.
 *
 * @public
 */
export interface StatusBarSlotProps {
  /** The figures, in the order they should read. */
  readonly items: readonly StatusBarItem[];
  /** The selection statistics, when there are any; render after the items. */
  readonly stats: ReactNode;
  /** Class for the element. */
  readonly className?: string;
}

/**
 * Adapter-owned rendering for {@link StatusBarChrome}.
 *
 * @public
 */
export interface StatusBarSlots {
  /** The strip itself. */
  readonly Bar: (props: StatusBarSlotProps) => ReactNode;
  /** The selection-stats strip, the same slots that component takes. */
  readonly stats: SelectionStatsSlots;
}

/**
 * What the status bar needs to describe the table.
 *
 * @public
 */
export interface StatusBarChromeProps {
  /**
   * Whether the host asked for the strip.
   *
   * Off, this still renders the selection statistics on their own — the
   * bar HOSTS those figures, so an adapter that chose between the two
   * itself would carry the same "or they print twice" rule seven times
   * over. One element, one place that knows.
   */
  enabled: boolean;
  /** How many rows are rendered right now. */
  shown: number;
  /** The page being shown, for the row range. Defaults to the first. */
  page?: number;
  /** The page size, for the row range. Defaults to `shown`. */
  limit?: number;
  /** How many rows the whole filtered set holds, when the source knows. */
  total?: number;
  /** How many rows are selected. */
  selected: number;
  /** The multi-cell selection's figures, straight from `shell.selectionStats`. */
  stats: SelectionStats | null;
  /** Labels for each figure; falls back to the built-in English. */
  labels?: TableLabels;
  /** Locale tag for number formatting. The host's default when omitted. */
  locale?: string;
  /** A kit's own class for the strip. */
  className?: string;
  /**
   * Opted-in features that cannot run. Always shown — the person at the
   * table must see them even when the host did not ask for `statusBar`.
   * Row/selected counts still require `enabled`.
   */
  notices?: readonly FeatureNotice[];
  /** Adapter-owned visible components. */
  slots: StatusBarSlots;
}

/**
 * Renders the status bar.
 *
 * @param props - The counts, the selection figures, and the kit's slots.
 * @returns The strip.
 *
 * @public
 */
export function StatusBarChrome(props: Readonly<StatusBarChromeProps>) {
  const { Bar } = props.slots;
  const stats = (
    <SelectionStatsChrome
      stats={props.stats}
      labels={props.labels}
      locale={props.locale}
      slots={props.slots.stats}
    />
  );
  const items = statusBarItems(props);
  const showBar = props.enabled || items.length > 0;
  if (!showBar) return stats;
  // A notice brings the strip up without `statusBar()`; the selection figures
  // stay inside it rather than disappearing while the notice shows.
  return <Bar items={items} className={props.className} stats={stats} />;
}
