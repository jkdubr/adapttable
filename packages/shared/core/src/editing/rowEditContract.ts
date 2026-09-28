/**
 * Row and batch editing's contract: the headless state their Chrome reads and
 * the controls a kit fills them with.
 *
 * Every binding's row-edit actions and batch bar lay out the same buttons;
 * only the components differ. Rendered content is the binding's `TNode`, so a
 * React kit and an Angular kit fill the same shapes with their own types.
 */
import type { DisplayValue } from "../display";
import type { FeatureHostState } from "../features/currentHost";
import type { TableLabels } from "../types";

/**
 * The drafts a row edit holds, by column key.
 *
 * @public
 */
export type RowEditDrafts = Readonly<Record<string, string>>;

/**
 * Headless row-editing state.
 *
 * @public
 */
export interface RowEditingState<TRow> {
  /** The row being edited, or `null` when none is. */
  activeRowId: string | null;
  /** Whether this row is the one being edited. */
  isEditing: (rowId: string) => boolean;
  /** Every draft in the open row, by column key. */
  drafts: RowEditDrafts;
  /** One column's draft in the open row. */
  draftFor: (columnKey: string) => string;
  /** Open a row, seeding every editable column from its current value. */
  begin: (row: TRow, rowId: string) => void;
  /** Replace one column's draft. */
  setDraft: (columnKey: string, value: string) => void;
  /**
   * Hand the host everything the reader changed, as one patch, then close.
   * A no-op when nothing is open, and it reports nothing when nothing changed —
   * saving an untouched row is a write the host never asked for.
   */
  save: () => void;
  /** Throw every draft away and close. */
  cancel: () => void;
  /** Whether any draft differs from the row's stored value. */
  isDirty: boolean;
  /** A digest of the open row's drafts, for a row memo comparator. */
  signature: string;
  /** The row the form opened against, or `undefined` when none is open. */
  openedRow: () => TRow | undefined;
  /**
   * What each field read when the form opened, or last accepted. This — not
   * the row — is what an incoming change is measured against, field by field.
   */
  seeds: () => RowEditDrafts | undefined;
  /**
   * Accept an incoming row's values for these fields as what they now read,
   * leaving the drafts alone: the reader keeps what they typed, and the patch
   * still carries it.
   */
  acceptSeeds: (row: TRow, columnKeys: readonly string[]) => void;
  /**
   * Take an incoming row's values for these fields, into both the drafts and
   * what they are measured against — nothing of the reader's is lost, because
   * these are fields they had not typed in, or chose to give up.
   */
  takeSeeds: (row: TRow, columnKeys: readonly string[]) => void;
  /** The table that owns these editors — never a sibling's host. */
  featureHost?: FeatureHostState;
}

/**
 * Headless batch-editing state.
 *
 * @public
 */
export interface BatchEditingState<TRow> {
  /** How many rows are waiting — what a "3 unsaved rows" line reads. */
  count: number;
  /** Whether anything is waiting at all. */
  pending: boolean;
  /** Whether this row has pending changes. */
  isPending: (rowId: string) => boolean;
  /** This cell's draft, or the row's stored value when it has none. */
  draftFor: (row: TRow, rowId: string, columnKey: string) => string;
  /** Whether this cell has been changed. */
  isChanged: (rowId: string, columnKey: string) => boolean;
  /** Change one cell, without telling the host. */
  setDraft: (
    row: TRow,
    rowId: string,
    columnKey: string,
    value: string
  ) => void;
  /** Hand the host every pending row, as one list, then forget them. */
  saveAll: () => void;
  /** Forget everything, restoring nothing — the drafts were never applied. */
  cancelAll: () => void;
  /** Forget one row's changes. */
  cancelRow: (rowId: string) => void;
  /** Every pending row, and what each changed field is measured against. */
  entries: readonly {
    readonly rowId: string;
    /**
     * The row as it read when the reader first changed it. Untyped because
     * the chrome hands this state around as `BatchEditingState<never>`, and a
     * row in an output position would stop it fitting there.
     */
    readonly openedRow: unknown;
    readonly seeds: Readonly<Record<string, string>>;
    readonly drafts: Readonly<Record<string, string>>;
  }[];
  /**
   * Keep mine: these fields now read the incoming values, and the drafts
   * stand — so the patch still carries what the reader typed.
   */
  acceptSeeds: (
    row: TRow,
    rowId: string,
    columnKeys: readonly string[]
  ) => void;
  /**
   * Take theirs: these fields stop being changes at all, so the cells fall
   * back to what the row now reads.
   */
  takeSeeds: (row: TRow, rowId: string, columnKeys: readonly string[]) => void;
  /** A digest of the pending drafts, for a row memo comparator. */
  signature: string;
  /** The table that owns these editors — never a sibling's host. */
  featureHost?: FeatureHostState;
}

/**
 * An incoming change to the row a form has open.
 *
 * The fields that moved carry the question themselves, each with the notice a
 * cell shows; this is what the row's own controls need to know — that an
 * answer is outstanding, so there is nothing to save yet.
 *
 * @public
 */
export interface RowEditConflict {
  /** Whether this row is waiting on an answer. */
  readonly asking: boolean;
}

/**
 * Props for a binding's `rowEditControls` helper.
 *
 * @public
 */
export interface RowEditControlsOptions<TRow> {
  /** The row-editing state from the chrome. */
  rowEditing: RowEditingState<TRow>;
  /** The row this control set belongs to. */
  row: TRow;
  /** Its stable id. */
  rowId: string;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
}

/**
 * Glyphs for the row-mode controls.
 *
 * Each kit draws its own pencil, check and cross, with `labels.editRow`,
 * `labels.saveRow` and `labels.cancel` as both the accessible name and the
 * hover title — an actions column is a narrow place, and three words per
 * control crowd out the row. Pass a node to use your own glyph instead, or
 * `false` to show the label as text.
 *
 * @public
 */
export interface RowEditIcons {
  /** The control that opens the row. */
  readonly begin?: DisplayValue | false;
  /** The control that hands the host the patch. */
  readonly save?: DisplayValue | false;
  /** The control that throws the drafts away. */
  readonly cancel?: DisplayValue | false;
}

/**
 * Props for an adapter `RowEditActions` — no slots on the public API.
 *
 * @public
 */
export interface RowEditActionsProps<
  TRow,
> extends RowEditControlsOptions<TRow> {
  /** Class for the control group. */
  className?: string;
  /** Class for each button. */
  buttonClassName?: string;
  /** Glyph overrides — see {@link RowEditIcons}. */
  icons?: RowEditIcons;
  /**
   * Whether an incoming change to this row is waiting on the reader, and what
   * happens either way. The open form is measured against the row it opened
   * on, so a change underneath is a question only the reader can answer.
   */
  conflict?: RowEditConflict;
  /**
   * Whether to draw the control that opens the row. `false` when a host row
   * action carries `editsRow` and owns that trigger — see
   * `resolveRowEditTrigger`. Save and cancel are unaffected: they belong to
   * the open row, not to whatever opened it.
   */
  showBegin?: boolean;
}

/**
 * Kit button the row-edit chrome calls.
 *
 * @public
 */
export interface RowEditButtonProps {
  /** Accessible name for the control, and its hover title. */
  readonly label: string;
  /** Part name, so styling can target this element. */
  readonly part: string;
  /**
   * What to draw inside the button. A node is the glyph to use; `false` asks
   * for the label as text; `undefined` leaves the choice to the kit, which
   * draws its own glyph for this part.
   */
  readonly icon?: DisplayValue | false;
  /** Class for the element. */
  readonly className?: string;
  /** Called when pressed. */
  readonly onClick: (event: { stopPropagation: () => void }) => void;
}

/**
 * Kit-supplied controls for the row-edit actions' Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface RowEditActionsSlots<TNode = unknown> {
  /** Renders a button. */
  readonly Button: (props: RowEditButtonProps) => TNode;
}

/**
 * Props for an adapter `BatchEditBar` — no slots on the public API.
 *
 * @public
 */
export interface BatchEditBarProps<TRow> {
  /** The batch state from the chrome. */
  batch: BatchEditingState<TRow>;
  /**
   * Whether any cell in the batch is waiting on an answer. Saving past one
   * would write over a value the reader has not looked at, so the bar says
   * what is holding it up instead of offering the save.
   */
  contested?: boolean;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** Class for the bar. */
  className?: string;
  /** Class for each button. */
  buttonClassName?: string;
}

/**
 * Kit button the batch-edit bar calls.
 *
 * @public
 */
export interface BatchEditButtonProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Part name, so styling can target this element. */
  readonly part: string;
  /** Class for the element. */
  readonly className?: string;
  /** Called when pressed. */
  readonly onClick: () => void;
}

/**
 * Kit-supplied controls for the batch-edit bar's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface BatchEditBarSlots<TNode = unknown> {
  /** Renders a button. */
  readonly Button: (props: BatchEditButtonProps) => TNode;
}
