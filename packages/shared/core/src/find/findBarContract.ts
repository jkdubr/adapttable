/**
 * The find bar's contract: the state its Chrome reads and the controls a kit
 * fills it with.
 *
 * Every binding's find-bar Chrome lays out the same search field and the same
 * three buttons; only the components differ. Rendered content is the
 * binding's `TNode` and key events are its `TKeyboardEvent`, so a React kit
 * and an Angular kit fill the same shapes with their own types.
 */
import type { GridCell } from "../focus/gridFocus";
import type { TableLabels } from "../types";

/**
 * Find-in-table state over the loaded rows, as a binding's find hook or
 * injector exposes it.
 *
 * @public
 */
export interface FindInTableState {
  /** Whether the bar is showing. */
  open: boolean;
  /** Show or hide the bar. Hiding clears the query, as a find bar does. */
  setOpen: (open: boolean) => void;
  /** The current query. */
  query: string;
  /** Type into the find bar. Resets the walk to the first hit. */
  setQuery: (query: string) => void;
  /** Every matching cell, in reading order. */
  matches: readonly GridCell[];
  /** Their keys, for marking cells as this render walks them. */
  matchKeys: ReadonlySet<string>;
  /** Which match the walk is on, from zero; `-1` when there are none. */
  index: number;
  /** The cell the walk is on, or `null`. */
  current: GridCell | null;
  /** Step to the next hit, wrapping at the end. */
  next: () => void;
  /** Step to the previous hit, wrapping at the start. */
  previous: () => void;
  /**
   * Open the bar — what Ctrl/Cmd+F and a host's own button call. `undefined`
   * when the feature is off, so the shortcut stays the BROWSER'S rather than
   * being swallowed by a table that has no bar to show.
   */
  openBar?: () => void;
}

/**
 * Props for a kit's `FindBar` — no slots on the public API.
 *
 * @public
 */
export interface FindBarProps {
  /** The find state, straight from the shell. */
  find: FindInTableState;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** A kit's own class for the bar. */
  className?: string;
}

/**
 * Kit search field the find bar calls.
 *
 * @typeParam TKeyboardEvent - The binding's key event (React's synthetic
 *   event in React, the DOM event elsewhere).
 *
 * @public
 */
export interface FindSearchProps<TKeyboardEvent = KeyboardEvent> {
  /** Accessible name for the control. */
  readonly label: string;
  /** Placeholder text. */
  readonly placeholder: string;
  /** Current value. */
  readonly value: string;
  /** Ref the chrome focuses when the bar opens. */
  readonly focusRef: (node: { focus: () => void } | null) => void;
  /** Called with the new value. */
  readonly onChange: (value: string) => void;
  /** Handles the keys this control owns. */
  readonly onKeyDown: (event: TKeyboardEvent) => void;
}

/**
 * One find-bar glyph.
 *
 * @public
 */
export type FindButtonKind = "previous" | "next" | "close";

/**
 * Kit button the find bar calls.
 *
 * @public
 */
export interface FindButtonProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Part name, so styling can target this element. */
  readonly part: string;
  /** Which find-bar button this is. */
  readonly kind: FindButtonKind;
  /** Whether the control is offered but not available. */
  readonly disabled?: boolean;
  /** Called when pressed. */
  readonly onClick: () => void;
}

/**
 * Kit-supplied controls for the find bar's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TKeyboardEvent - The binding's key event.
 *
 * @public
 */
export interface FindBarSlots<TNode = unknown, TKeyboardEvent = KeyboardEvent> {
  /** Renders the search box. */
  readonly Search: (props: FindSearchProps<TKeyboardEvent>) => TNode;
  /** Renders a button. */
  readonly Button: (props: FindButtonProps) => TNode;
}
