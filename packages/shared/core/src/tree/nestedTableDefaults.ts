/**
 * The defaults a table nested under a row must be mounted with.
 *
 * A binding mounts the kit's own table inside the row; what that table must
 * be told — never write the URL, no second search box, the parent's density
 * and labels, and an accessible name — is decided here once.
 */
import type { TableLabels } from "../types";
import type { TableDensity } from "../url/viewStateSlices";

/**
 * The props a nested table must be mounted with, handed to the host's `table`
 * callback to spread onto the kit's own component.
 *
 * @public
 */
export interface NestedTableDefaults {
  /**
   * Never true. Two tables writing `?page=` fight over one URL, and the loser
   * silently resets while the reader is using it.
   */
  urlSync: false;
  /**
   * Off by default: a second search box inside a row reads as chrome rather
   * than as a feature. Spread these first and pass `searchable` after to keep
   * it.
   */
  searchable: boolean;
  /** The parent's density, so the child matches rather than guessing. */
  density: TableDensity | undefined;
  /** The parent's labels, so a nested table is localized like its parent. */
  labels: TableLabels | undefined;
  /** The accessible name, also used on the region around it. */
  tableLabel: string;
}

/**
 * What the parent contributes to its nested tables.
 *
 * @public
 */
export interface NestedTableParent {
  /** The parent's density. */
  density?: TableDensity;
  /** The parent's labels. */
  labels?: TableLabels;
}

/**
 * The name a nested table takes when the host does not give it one.
 *
 * @public
 */
export const NESTED_TABLE_DEFAULT_LABEL = "Row details";

/**
 * A nested table's accessible name: the host's, or the default.
 *
 * @param label - The host's name, if any.
 * @returns The name.
 *
 * @public
 */
export function nestedTableLabel(label: string | undefined): string {
  return label ?? NESTED_TABLE_DEFAULT_LABEL;
}

/**
 * The defaults a table inside a row is mounted with.
 *
 * @param label - The nested table's accessible name.
 * @param parent - What the parent table contributes.
 * @returns Props to spread onto the kit's own table.
 *
 * @public
 */
export function nestedTableDefaults(
  label: string,
  parent: NestedTableParent = {}
): NestedTableDefaults {
  return {
    urlSync: false,
    searchable: false,
    density: parent.density,
    labels: parent.labels,
    tableLabel: label,
  };
}
