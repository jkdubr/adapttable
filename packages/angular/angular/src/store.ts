/**
 * Core's stores as Angular signals.
 *
 * Every store in `@adapttable/core` has the same two members — `getSnapshot`
 * and `subscribe` — so one adapter turns any of them into a read-only signal
 * that follows it until the injection context is destroyed.
 */
import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  Injector,
  isSignal,
  type Signal,
  signal,
} from "@angular/core";

/**
 * The shape every `@adapttable/core` store shares.
 *
 * @public
 */
export interface ExternalStore<T> {
  /** The current value, the same object until something it holds changes. */
  readonly getSnapshot: () => T;
  /** Listen for changes. Returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
}

/**
 * Options for {@link fromStore}.
 *
 * @public
 */
export interface FromStoreOptions {
  /**
   * The injector whose `DestroyRef` ends the subscription. Omit to use the
   * current injection context.
   */
  readonly injector?: Injector;
}

/**
 * A read-only signal over a core store.
 *
 * The signal holds the store's snapshot and moves when the store notifies
 * with a different one. The subscription ends when the injection context —
 * the component, directive or service that called this — is destroyed.
 *
 * @param store - Any store with `getSnapshot` and `subscribe`.
 * @param options - See {@link FromStoreOptions}.
 * @returns The signal.
 *
 * @public
 */
export function fromStore<T>(
  store: ExternalStore<T>,
  options: FromStoreOptions = {}
): Signal<T> {
  if (!options.injector) assertInInjectionContext(fromStore);
  const injector = options.injector ?? inject(Injector);
  const value = signal(store.getSnapshot());
  const unsubscribe = store.subscribe(() => {
    value.set(store.getSnapshot());
  });
  injector.get(DestroyRef).onDestroy(unsubscribe);
  return value.asReadonly();
}

/**
 * A value, or a signal of one. Options that may change after creation take
 * either, so a component can pass its `input()` straight through.
 *
 * @public
 */
export type MaybeSignal<T> = T | Signal<T>;

/**
 * An optional value, or a signal that may hold none — a component's
 * optional `input()` passes straight through.
 *
 * @public
 */
export type MaybeSignalOptional<T> = T | Signal<T | undefined>;

/** The current value of a {@link MaybeSignal}, tracked when it is a signal. */
export function readMaybe<T>(value: MaybeSignal<T>): T {
  return isSignal(value) ? value() : value;
}
