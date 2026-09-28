/**
 * Keyboard shortcuts, as a list the host can read and change.
 *
 * A shortcut hard-coded in a key handler is a shortcut nobody can remap,
 * and remapping is not a preference — it is the difference between a table
 * that works inside an application and one that fights it. So a shortcut is
 * data: a chord, and the command key it runs.
 *
 * Matching deliberately ignores the physical key's layout — `event.key` is
 * the character the user's layout produces, which is what they typed and
 * what the shortcut was written as. It is compared case-insensitively,
 * because Shift is part of the chord rather than part of the letter.
 */
import type { ChordKeyEvent } from "../find/findBar";

/**
 * One shortcut: the chord, and what it runs.
 *
 * @public
 */
export interface Shortcut {
  /**
   * The chord, as `"mod+k"`. `mod` is Cmd on a Mac and Ctrl elsewhere,
   * which is the only way to write one shortcut that is right on both.
   * Also accepts `ctrl`, `meta`, `alt` and `shift`.
   */
  chord: string;
  /** The key of the command it runs. */
  command: string;
}

/**
 * The shortcuts a table has unless the host says otherwise.
 *
 * @public
 */
export const DEFAULT_SHORTCUTS: readonly Shortcut[] = [
  { chord: "mod+k", command: "command-palette" },
];

/**
 * A chord, parsed.
 *
 * @public
 */
export interface ParsedChord {
  /** The key, lower-cased. */
  readonly key: string;
  /** Cmd on a Mac, Ctrl elsewhere — either satisfies it. */
  readonly mod: boolean;
  /** Ctrl specifically. */
  readonly ctrl: boolean;
  /** Cmd (Meta) specifically. */
  readonly meta: boolean;
  /** Alt. */
  readonly alt: boolean;
  /** Shift. */
  readonly shift: boolean;
}

/**
 * Parse a chord such as `"mod+shift+k"`.
 *
 * @param chord - The chord text.
 * @returns The parsed chord.
 *
 * @public
 */
export function parseChord(chord: string): ParsedChord {
  const parts = chord.toLowerCase().split("+");
  return {
    key: parts.at(-1) ?? "",
    mod: parts.includes("mod"),
    ctrl: parts.includes("ctrl"),
    meta: parts.includes("meta"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
  };
}

/**
 * Whether a chord needs a Ctrl, Cmd or `mod` modifier.
 *
 * @param chord - The parsed chord.
 * @returns `false` for a single-key chord such as `"e"` or `"shift+e"`.
 *
 * @public
 */
export function chordHasCommandModifier(chord: ParsedChord): boolean {
  return chord.mod || chord.ctrl || chord.meta;
}

/**
 * Whether a key event is this chord.
 *
 * @param chord - The parsed chord.
 * @param event - The key event.
 * @returns Whether it matches.
 *
 * @public
 */
export function chordMatches(
  chord: ParsedChord,
  event: ChordKeyEvent
): boolean {
  if (event.key.toLowerCase() !== chord.key) return false;
  // `mod` is satisfied by either, so one chord is right on every platform
  // without the host writing two.
  const mod = event.metaKey || event.ctrlKey;
  if (chord.mod && !mod) return false;
  if (chord.ctrl && !event.ctrlKey) return false;
  if (chord.meta && !event.metaKey) return false;
  if (chord.alt !== event.altKey) return false;
  if (chord.shift !== event.shiftKey) return false;
  // A chord with no modifier must not fire while a modifier is held, or
  // "e" would trigger inside Ctrl+E.
  return chordHasCommandModifier(chord) || !mod;
}

/**
 * True while the event came from somewhere text is being typed.
 *
 * A single-key shortcut must not fire while someone is filling in the
 * search box or a cell editor. Chords with a modifier still work there,
 * because that is what a modifier is for.
 *
 * @param target - The event's target.
 * @returns Whether it is a text entry.
 *
 * @public
 */
export function isTextEntryTarget(target: unknown): boolean {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable === true
  );
}

/**
 * A key event as the shortcut matcher reads it.
 *
 * @public
 */
export interface ShortcutKeyEvent extends ChordKeyEvent {
  /** Where the key went down. */
  readonly target: unknown;
  /** Stops the browser's own handling. */
  preventDefault(): void;
}

/**
 * Build a key handler that runs the first matching shortcut's command.
 *
 * @param shortcuts - The shortcuts.
 * @param onCommand - Run a command by key.
 * @returns The handler; it prevents the default of a key it claims and
 * returns whether it did.
 *
 * @public
 */
export function createShortcutHandler(
  shortcuts: readonly Shortcut[],
  onCommand: (command: string) => void
): (event: ShortcutKeyEvent) => boolean {
  const parsed = shortcuts.map((shortcut) => ({
    chord: parseChord(shortcut.chord),
    command: shortcut.command,
  }));
  return (event) => {
    for (const { chord, command } of parsed) {
      if (!chordHasCommandModifier(chord) && isTextEntryTarget(event.target)) {
        continue;
      }
      if (!chordMatches(chord, event)) continue;
      event.preventDefault();
      onCommand(command);
      return true;
    }
    return false;
  };
}
