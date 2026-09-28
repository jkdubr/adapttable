/**
 * Shared state shapes a framework binding returns from its hooks. Each
 * binding adapts core's stores to its reactivity and hands back these
 * shapes, so a kit reads the same fields in every framework.
 */
import type { PivotConfig } from "./pivotModel";

/**
 * The controlled state to hand the panel and the engine.
 *
 * @public
 */
export interface UsePivotUrlStateResult {
  /** What to pivot, and how. Give it to the panel and to `pivot`. */
  config: PivotConfig;
  /** Persist a new configuration. Wire to the panel's `onChange`. */
  onConfigChange: (next: PivotConfig) => void;
  /**
   * The folded subtotal lines, by key — `pivot`'s `collapsed` option, so the
   * link and the rendering agree without the host holding a second copy.
   */
  collapsed: ReadonlySet<string>;
  /** Persist a new folded set. Wire to whatever folds a subtotal line. */
  onCollapsedChange: (next: ReadonlySet<string>) => void;
}
