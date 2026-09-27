/**
 * A search box that types fast and commits slowly: the text follows every
 * keystroke, and the trimmed term reaches the view state once typing pauses.
 */
import {
  DestroyRef,
  effect,
  type Injector,
  type Signal,
  signal,
  untracked,
} from "@angular/core";

/** The live text of a debounced search box, and its setter. */
export interface SearchInput {
  /** What the box shows, committed or not. */
  readonly value: Signal<string>;
  /** Type into the box; the trimmed term commits after the delay. */
  readonly setValue: (next: string) => void;
  /** Commit a term now, skipping the delay. */
  readonly commit: (term: string) => void;
}

/**
 * Bridge the box to the committed search. An outside change to the committed
 * term — the back button, a deep link, clear-all — replaces the text, but
 * the table's own commit coming back does not, so a keystroke typed while it
 * travels is kept.
 */
export function createSearchInput(
  committed: Signal<string>,
  setSearch: (term: string) => void,
  delayMs: number,
  injector: Injector
): SearchInput {
  const value = signal(untracked(committed));
  let last = untracked(committed);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
  };
  const commit = (term: string): void => {
    cancel();
    const trimmed = term.trim();
    value.set(trimmed);
    if (trimmed === last) return;
    last = trimmed;
    setSearch(trimmed);
  };

  effect(
    () => {
      const next = committed();
      if (next === last) return;
      cancel();
      last = next;
      value.set(next);
    },
    { injector }
  );
  injector.get(DestroyRef).onDestroy(cancel);

  return {
    value: value.asReadonly(),
    setValue: (next) => {
      value.set(next);
      cancel();
      timer = setTimeout(() => {
        timer = undefined;
        const trimmed = next.trim();
        if (trimmed === last) return;
        last = trimmed;
        setSearch(trimmed);
      }, delayMs);
    },
    commit,
  };
}
