/**
 * A definition's choices: a static list, an async loader, or nothing.
 */
import { devWarn, type FilterDef, type FilterOption } from "@adapttable/core";
import { DestroyRef, type Injector, type Signal, signal } from "@angular/core";

/**
 * A filter's choices, resolved.
 *
 * @public
 */
export interface FilterOptionsState {
  /** The choices. */
  readonly options: readonly FilterOption[];
  /** Whether a loader is still running. */
  readonly loading: boolean;
}

const NO_OPTIONS: readonly FilterOption[] = [];

/**
 * A definition's choices as a signal, loading them when they come from a
 * loader.
 *
 * @param def - The definition.
 * @param injector - Ends a load in flight when the caller is destroyed.
 * @returns The choices and whether they are loading.
 *
 * @public
 */
export function filterOptionsFor<TRow>(
  def: Pick<FilterDef<TRow>, "key" | "options">,
  injector: Injector
): Signal<FilterOptionsState> {
  const source = def.options;
  if (Array.isArray(source)) {
    return signal({ options: source, loading: false }).asReadonly();
  }
  if (typeof source !== "function") {
    if (source === "auto") {
      devWarn(
        `filter "${def.key}" uses options: "auto" on a tier with no full dataset — provide an options array or loader.`
      );
    }
    return signal({ options: NO_OPTIONS, loading: false }).asReadonly();
  }
  const state = signal<FilterOptionsState>({
    options: NO_OPTIONS,
    loading: true,
  });
  let alive = true;
  injector.get(DestroyRef).onDestroy(() => {
    alive = false;
  });
  source().then(
    (options) => {
      if (alive) state.set({ options, loading: false });
    },
    () => {
      if (!alive) return;
      devWarn(`async options for filter "${def.key}" failed to load.`);
      state.set({ options: NO_OPTIONS, loading: false });
    }
  );
  return state.asReadonly();
}
