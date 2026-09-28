/**
 * The two pieces every data-tier controller is built from: a subscription a
 * binding re-renders through, and an identity memo for derived inputs.
 */

/** Listeners told when a controller's own state moved, with a revision. */
export interface SourceSignal {
  readonly subscribe: (listener: () => void) => () => void;
  readonly revision: () => number;
  readonly notify: () => void;
}

/** Create a signal a binding subscribes to. */
export function createSourceSignal(): SourceSignal {
  const listeners = new Set<() => void>();
  let revision = 0;
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    revision: () => revision,
    notify() {
      revision += 1;
      for (const listener of listeners) listener();
    },
  };
}

/** Recompute only when an input changed identity, like a memo hook. */
export function memoOne<TArgs extends readonly unknown[], TResult>(
  compute: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  let last: { args: TArgs; result: TResult } | undefined;
  return (...args) => {
    if (last?.args.every((arg, index) => Object.is(arg, args[index]))) {
      return last.result;
    }
    const result = compute(...args);
    last = { args, result };
    return result;
  };
}
