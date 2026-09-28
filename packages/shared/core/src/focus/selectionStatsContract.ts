/**
 * The selection-stats strip's contract: the props its Chrome takes and the
 * component a kit fills it with.
 *
 * Every binding's Chrome formats the same figures in the same order; the kit
 * draws them. Rendered content is the binding's `TNode`, so a React kit and
 * an Angular kit fill the same shape with their own nodes.
 */
import type { TableLabels } from "../types";
import type { SelectionStats } from "./selectionStats";
import type { SelectionStatPart } from "./statusBar";

export type { SelectionStatPart };

/**
 * Props for the selection-stats Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface SelectionStatsChromeProps<TNode = unknown> {
  /** The statistics, straight from `shell.selectionStats`. */
  stats: SelectionStats | null;
  /** Labels for each figure; falls back to the built-in English. */
  labels?: TableLabels;
  /** Locale tag for number formatting. The host's default when omitted. */
  locale?: string;
  /** A kit's own class for the strip. */
  className?: string;
  /** Adapter-owned visible component. */
  slots: SelectionStatsSlots<TNode>;
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
 * Adapter-owned rendering for the selection-stats Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface SelectionStatsSlots<TNode = unknown> {
  /** Renders the selection statistics. */
  readonly Stats: (props: SelectionStatsSlotProps) => TNode;
}
