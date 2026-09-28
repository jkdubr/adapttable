/**
 * Shared state shapes a framework binding returns from its hooks. Each
 * binding adapts core's stores to its reactivity and hands back these
 * shapes, so a kit reads the same fields in every framework.
 */
import type { FormulaColumnSpec } from "./formulaColumn";

/**
 * The controlled pair to hand a formula bar and {@link buildFormulaColumns}.
 *
 * @public
 */
export interface UseFormulaUrlStateResult {
  /** The columns — from the URL, or the default while the URL is silent. */
  formulas: readonly FormulaColumnSpec[];
  /** Persist a new list. Wire to whatever adds and removes a column. */
  onFormulasChange: (next: readonly FormulaColumnSpec[]) => void;
}
