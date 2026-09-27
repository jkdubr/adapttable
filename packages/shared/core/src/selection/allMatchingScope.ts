/**
 * The "select all matching" scope: whether a selection stands for the rows
 * the reader ticked or for every row the current filter matches, across
 * every page.
 *
 * The rule is small and easy to get subtly wrong in each binding. Choosing
 * "all matching" only takes when the source can answer for rows past the
 * page — a selection over rows nobody can name is a selection nobody can act
 * on — and any explicit change to the ids narrows the scope back to them.
 */

/**
 * The "select all matching" scope's store.
 *
 * @public
 */
export interface AllMatchingScope {
  /** Whether "all matching" is active. */
  readonly getSnapshot: () => boolean;
  /** Listen for changes. Returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /**
   * Extend the selection to every matching row. Ignored when the source
   * cannot reach past the page.
   *
   * @param acrossPages - Whether the source can answer for rows past the page.
   * @returns Whether the scope is now "all matching".
   */
  readonly select: (acrossPages: boolean) => boolean;
  /** Narrow back to the concrete ids — what every explicit change does. */
  readonly narrow: () => void;
}

/**
 * Create the "select all matching" scope, starting narrowed.
 *
 * @returns The scope.
 *
 * @public
 */
export function createAllMatchingScope(): AllMatchingScope {
  let allMatching = false;
  const listeners = new Set<() => void>();
  const write = (next: boolean): void => {
    if (next === allMatching) return;
    allMatching = next;
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => allMatching,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    select(acrossPages) {
      if (acrossPages) write(true);
      return allMatching;
    },
    narrow() {
      write(false);
    },
  };
}
