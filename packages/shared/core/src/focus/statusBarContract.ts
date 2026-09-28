/**
 * The status bar's contract: the props its Chrome takes and the pieces a kit
 * fills it with.
 *
 * Every binding's status-bar Chrome composes the same figures, in the same
 * order, with the same live region; the kit draws the strip. Rendered content
 * is the binding's `TNode`, so a React kit and an Angular kit fill the same
 * shapes with their own nodes.
 */
import type { FeatureNotice } from "../state/featureNotices";
import type { TableLabels } from "../types";
import type { SelectionStats } from "./selectionStats";
import type { SelectionStatsSlots } from "./selectionStatsContract";
import type { StatusBarItem } from "./statusBar";

export type { StatusBarItem };

/**
 * Props an adapter's status-bar component receives.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface StatusBarSlotProps<TNode = unknown> {
  /** The figures, in the order they should read. */
  readonly items: readonly StatusBarItem[];
  /** The selection statistics, when there are any; render after the items. */
  readonly stats: TNode;
  /** Class for the element. */
  readonly className?: string;
}

/**
 * Adapter-owned rendering for the status bar's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface StatusBarSlots<TNode = unknown> {
  /** The strip itself. */
  readonly Bar: (props: StatusBarSlotProps<TNode>) => TNode;
  /** The selection-stats strip, the same slots that component takes. */
  readonly stats: SelectionStatsSlots<TNode>;
}

/**
 * What the status bar needs to describe the table.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface StatusBarChromeProps<TNode = unknown> {
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
  slots: StatusBarSlots<TNode>;
}
