/**
 * What every editing store shares: a listener set, and a thenable check for
 * the host's `onCellEdit` result.
 */

/** A store's listener set. */
export function listenerSet(): {
  readonly subscribe: (listener: () => void) => () => void;
  readonly notify: () => void;
} {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      for (const listener of listeners) listener();
    },
  };
}

/** Whether a host's return value is a promise the table should watch. */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}
