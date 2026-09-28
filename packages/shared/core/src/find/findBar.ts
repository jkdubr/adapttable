/**
 * The find bar's behavior that every binding shares: the keys the search field
 * owns, the "3 of 17" count, the Ctrl/Cmd+F scope, and bringing the current
 * match into view when no grid moves focus to it.
 *
 * A binding wires these to its own event system; nothing here renders.
 */
import type { GridCell } from "../focus/gridFocus";
import type { TableLabels } from "../types";

/**
 * The find bar's count text — "3 of 17", or "No matches".
 *
 * @param current - The walk's position, from one.
 * @param total - How many hits there are.
 * @returns The count text.
 *
 * @public
 */
export function defaultFindMatchCount(current: number, total: number): string {
  return total === 0 ? "No matches" : `${current} of ${total}`;
}

/**
 * The count a find bar shows, through the host's `labels.findMatchCount` when
 * it gave one.
 *
 * @param labels - The table's labels, if any.
 * @param index - The walk's position, from zero; `-1` when there are none.
 * @param total - How many hits there are.
 * @returns The count text.
 *
 * @public
 */
export function findMatchCountText(
  labels: Pick<TableLabels, "findMatchCount"> | undefined,
  index: number,
  total: number
): string {
  return (labels?.findMatchCount ?? defaultFindMatchCount)(index + 1, total);
}

/**
 * The key event fields the find bar reads.
 *
 * @public
 */
export interface FindBarKeyEvent {
  /** The key's value, as `KeyboardEvent.key`. */
  readonly key: string;
  /** Whether Shift is held. */
  readonly shiftKey: boolean;
  /** Stops the browser's own handling. */
  preventDefault(): void;
}

/**
 * The find state the bar's keys act on.
 *
 * @public
 */
export interface FindBarKeyTarget {
  /** Show or hide the bar. */
  readonly setOpen: (open: boolean) => void;
  /** Step to the next hit. */
  readonly next: () => void;
  /** Step to the previous hit. */
  readonly previous: () => void;
}

/**
 * Handle a key in the find bar's search field: Enter walks forward,
 * Shift+Enter walks back and Escape closes, which is what every find bar does
 * and therefore what nobody should have to learn.
 *
 * @param event - The key event.
 * @param find - The find state to act on.
 * @returns Whether the key was the bar's.
 *
 * @public
 */
export function handleFindBarKey(
  event: FindBarKeyEvent,
  find: FindBarKeyTarget
): boolean {
  if (event.key === "Escape") {
    find.setOpen(false);
    return true;
  }
  if (event.key !== "Enter") return false;
  event.preventDefault();
  if (event.shiftKey) find.previous();
  else find.next();
  return true;
}

/**
 * The modifier fields of a key event.
 *
 * @public
 */
export interface ChordKeyEvent {
  /** The key's value, as `KeyboardEvent.key`. */
  readonly key: string;
  /** Whether Ctrl is held. */
  readonly ctrlKey: boolean;
  /** Whether Cmd (Meta) is held. */
  readonly metaKey: boolean;
  /** Whether Alt is held. */
  readonly altKey: boolean;
  /** Whether Shift is held. */
  readonly shiftKey: boolean;
}

/**
 * Whether a key event is Ctrl/Cmd+F with no other modifier.
 *
 * @param event - The key event.
 * @returns Whether it asks to find.
 *
 * @public
 */
export function isFindShortcut(event: ChordKeyEvent): boolean {
  if (event.key.toLowerCase() !== "f") return false;
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
}

/**
 * What a find shortcut scope needs.
 *
 * @public
 */
export interface FindShortcutScopeOptions {
  /** Whether an event target is inside the table. */
  readonly contains: (target: unknown) => boolean;
  /** Open the find bar. */
  readonly openBar: () => void;
}

/**
 * The handlers a binding attaches, in the capture phase, to the document.
 *
 * @public
 */
export interface FindShortcutScope {
  /** A pointer went down on `target`. */
  readonly pointerDown: (target: unknown) => void;
  /** Focus moved to `target`. */
  readonly focusIn: (target: unknown) => void;
  /**
   * A key went down. Opens the bar and prevents the browser's find when the
   * key is Ctrl/Cmd+F inside the table.
   */
  readonly keyDown: (
    event: ChordKeyEvent & {
      readonly target: unknown;
      preventDefault(): void;
    }
  ) => void;
}

/**
 * Ctrl/Cmd+F inside the table opens its find bar.
 *
 * "Inside" is focus within the table root, or — since a plain cell takes no
 * focus — a last pointer press that landed in it, until focus moves somewhere
 * else on the page. The browser's own find stays alone everywhere else.
 *
 * @param options - See {@link FindShortcutScopeOptions}.
 * @returns The handlers to attach.
 *
 * @public
 */
export function createFindShortcutScope(
  options: FindShortcutScopeOptions
): FindShortcutScope {
  let pressedInside = false;
  return {
    pointerDown(target) {
      pressedInside = options.contains(target);
    },
    focusIn(target) {
      if (!options.contains(target)) pressedInside = false;
    },
    keyDown(event) {
      if (!isFindShortcut(event)) return;
      if (!options.contains(event.target) && !pressedInside) return;
      event.preventDefault();
      options.openBar();
    },
  };
}

/**
 * The selector for the cell the find walk is on.
 *
 * @public
 */
export const FIND_CURRENT_MATCH_SELECTOR = "[data-cell-match-current]";

/**
 * Scroll the current match into view inside a table root — for a table with
 * no grid to move focus there. The mark is on the cell by the time this runs,
 * so the element to scroll to is simply the one carrying it.
 *
 * @param root - The table root, or `null`.
 * @returns Whether a cell was scrolled to.
 *
 * @public
 */
export function scrollCurrentMatchIntoView(
  root: Pick<ParentNode, "querySelector"> | null
): boolean {
  const cell = root?.querySelector(FIND_CURRENT_MATCH_SELECTOR);
  if (!(cell instanceof HTMLElement)) return false;
  cell.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  return true;
}

/**
 * The loaded row the current match sits on, for a virtualized body to scroll
 * into its window; `undefined` when there is no match or it is not loaded.
 *
 * @typeParam TRow - The row type.
 * @param rows - The rows the binding holds.
 * @param firstRowIndex - Where they start in the dataset.
 * @param current - The match the walk is on.
 * @returns The row, or `undefined`.
 *
 * @public
 */
export function findMatchRow<TRow>(
  rows: readonly TRow[],
  firstRowIndex: number | undefined,
  current: GridCell | null
): TRow | undefined {
  if (!current) return undefined;
  return rows[current.row - (firstRowIndex ?? 0)];
}
