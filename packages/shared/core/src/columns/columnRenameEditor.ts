/**
 * The inline column-name editor's rules: when a draft is valid, what a
 * submit does, and what it announces.
 *
 * Every kit renders its own label, input and buttons over this state; core
 * owns no form markup. Focus is the binding's: it remembers the control that
 * opened the editor and hands focus back when {@link ColumnRenameEditor}
 * reports a close.
 */

/**
 * What a column rename editor is configured with, each render.
 *
 * @public
 */
export interface ColumnRenameEditorOptions {
  /** Stable column key. */
  readonly key: string;
  /** Current display name. */
  readonly name: string;
  /** Commit channel supplied by the table. */
  readonly onRename: (key: string, name: string) => void;
  /** Localized validation message for a blank name. */
  readonly requiredMessage: string;
  /** Localized polite announcement builder. */
  readonly renamedMessage: (info: { previous: string; name: string }) => string;
}

/**
 * The editor's state at one moment.
 *
 * @public
 */
export interface ColumnRenameEditorSnapshot {
  /** Whether the inline form is visible. */
  readonly editing: boolean;
  /** Controlled input value. */
  readonly draft: string;
  /** Validation message after a blank submit or blur. */
  readonly error?: string;
  /** Polite message for the binding's live region. */
  readonly announcement: string;
}

/**
 * What a submit did.
 *
 * - `invalid`: the draft is blank; the editor stays open with an error.
 * - `unchanged`: the draft is the current name; the editor closed.
 * - `renamed`: the table was asked to rename; the editor closed.
 *
 * @public
 */
export type ColumnRenameSubmit = "invalid" | "unchanged" | "renamed";

/**
 * The column rename editor.
 *
 * @public
 */
export interface ColumnRenameEditor {
  /** The current state. */
  readonly getSnapshot: () => ColumnRenameEditorSnapshot;
  /** Listen for state changes. Returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Hand over this render's column, name and messages. */
  readonly configure: (options: ColumnRenameEditorOptions) => void;
  /** Open the editor, seeded from the current name. */
  readonly begin: () => void;
  /** Update the draft; a non-blank draft clears the required error. */
  readonly setDraft: (value: string) => void;
  /** Validate on blur: a blank draft shows the required error. */
  readonly blur: () => void;
  /** Commit a valid trimmed name. Anything but `invalid` closes the editor. */
  readonly submit: () => ColumnRenameSubmit;
  /** Discard the draft and close. */
  readonly cancel: () => void;
}

/**
 * Create a column rename editor.
 *
 * @param options - The column and messages it starts with.
 * @returns The editor.
 *
 * @public
 */
export function createColumnRenameEditor(
  options: ColumnRenameEditorOptions
): ColumnRenameEditor {
  let config = options;
  let state: ColumnRenameEditorSnapshot = {
    editing: false,
    draft: options.name,
    announcement: "",
  };
  const listeners = new Set<() => void>();
  const set = (patch: Partial<ColumnRenameEditorSnapshot>): void => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };
  const close = (patch: Partial<ColumnRenameEditorSnapshot> = {}): void =>
    set({ ...patch, editing: false, error: undefined });

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    configure(next) {
      config = next;
    },
    begin: () => set({ draft: config.name, error: undefined, editing: true }),
    setDraft: (value) =>
      set(
        value.trim() === ""
          ? { draft: value }
          : { draft: value, error: undefined }
      ),
    blur() {
      if (state.draft.trim() === "") set({ error: config.requiredMessage });
    },
    submit() {
      const next = state.draft.trim();
      if (next === "") {
        set({ error: config.requiredMessage });
        return "invalid";
      }
      if (next === config.name) {
        close();
        return "unchanged";
      }
      config.onRename(config.key, next);
      close({
        announcement: config.renamedMessage({
          previous: config.name,
          name: next,
        }),
      });
      return "renamed";
    },
    cancel: () => close({ draft: config.name }),
  };
}
