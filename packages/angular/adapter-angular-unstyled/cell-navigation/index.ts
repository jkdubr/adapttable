/**
 * Keyboard cell grid — `@adapttable/angular-unstyled/cell-navigation`.
 *
 * @packageDocumentation
 */
import {
  type AdaptTableFeature,
  cellNavigation as coreAngularCellNavigation,
  type CellNavigationOptions,
} from "@adapttable/angular";

/**
 * A keyboard grid with a focused cell. Compose it, or set the table's
 * `cellNavigation` input — either turns the grid on.
 *
 * @param options - Optional range-change listener.
 *
 * @public
 */
export function cellNavigation(
  options: CellNavigationOptions = {}
): AdaptTableFeature {
  return coreAngularCellNavigation(options);
}
