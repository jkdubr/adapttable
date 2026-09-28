/**
 * The command palette's contract: the props its Chrome takes and the pieces
 * a kit fills it with.
 *
 * Every binding's palette Chrome owns the same combobox pattern — focus, the
 * Tab trap, the highlighted option — and lets the kit draw the dialog, the
 * input and the rows. Rendered content is the binding's `TNode` and key
 * events are its `TKeyboardEvent`, so a React kit and an Angular kit fill the
 * same shapes with their own types.
 */
import type { TableLabels } from "../types";
import type { Command } from "./commandRegistry";

/**
 * Props an adapter's palette surface receives.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface CommandPaletteSurfaceProps<TNode = unknown> {
  /** Accessible name for the dialog. */
  readonly label: string;
  /** Close it — bind to the kit's own dismiss channel. */
  readonly onClose: () => void;
  /** Content rendered inside. */
  readonly children: TNode;
  /** Class for the element. */
  readonly className?: string;
}

/**
 * Props an adapter's search input receives.
 *
 * @typeParam TKeyboardEvent - The binding's key event (React's synthetic
 *   event in React, the DOM event elsewhere).
 *
 * @public
 */
export interface CommandPaletteInputProps<TKeyboardEvent = KeyboardEvent> {
  /** Spread onto the input: value, handlers, and the combobox wiring. */
  readonly inputProps: {
    readonly value: string;
    readonly onChange: (next: string) => void;
    readonly onKeyDown: (event: TKeyboardEvent) => void;
    readonly ref: (element: HTMLInputElement | null) => void;
    readonly role: "combobox";
    readonly "aria-expanded": true;
    readonly "aria-controls": string;
    readonly "aria-activedescendant": string | undefined;
    readonly "aria-label": string;
    readonly placeholder: string;
    readonly "data-adapttable-part": "command-input";
  };
}

/**
 * Props an adapter's command row receives.
 *
 * @public
 */
export interface CommandPaletteItemProps {
  /** The command being rendered. */
  readonly command: Command;
  /** Whether this entry is the highlighted one. */
  readonly active: boolean;
  /** Spread onto the row: the option role, its id, and selection. */
  readonly itemProps: {
    readonly id: string;
    readonly role: "option";
    readonly "aria-selected": boolean;
    readonly "aria-disabled": boolean | undefined;
    readonly "data-adapttable-part": "command-item";
    readonly onClick: () => void;
    readonly onMouseEnter: () => void;
  };
}

/**
 * Adapter-owned rendering for the command palette's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TKeyboardEvent - The binding's key event.
 *
 * @public
 */
export interface CommandPaletteSlots<
  TNode = unknown,
  TKeyboardEvent = KeyboardEvent,
> {
  /** The modal surface. */
  readonly Surface: (props: CommandPaletteSurfaceProps<TNode>) => TNode;
  /** The search box. */
  readonly Input: (props: CommandPaletteInputProps<TKeyboardEvent>) => TNode;
  /** One command. */
  readonly Item: (props: CommandPaletteItemProps) => TNode;
  /** Shown when nothing matches. */
  readonly Empty: (props: { readonly message: string }) => TNode;
}

/**
 * What the palette needs to render.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TKeyboardEvent - The binding's key event.
 *
 * @public
 */
export interface CommandPaletteChromeProps<
  TNode = unknown,
  TKeyboardEvent = KeyboardEvent,
> {
  /** Every command available right now. */
  commands: readonly Command[];
  /** Whether it is showing. */
  open: boolean;
  /** Close it. */
  onClose: () => void;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** A kit's own class for the surface. */
  className?: string;
  /** Adapter-owned visible components. */
  slots: CommandPaletteSlots<TNode, TKeyboardEvent>;
}
