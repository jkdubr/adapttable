/**
 * Row and batch editing's contract: the headless state their Chrome reads and
 * the controls a kit fills them with.
 *
 * Every binding's row-edit actions and batch bar lay out the same buttons;
 * only the components differ. Rendered content is the binding's `TNode`, so a
 * React kit and an Angular kit fill the same shapes with their own types.
 */
import type { DisplayValue } from "../display";
import type { TableLabels } from "../types";
import type { BatchEditingState } from "./batchEditing";
import type { RowEditConflict, RowEditControlsOptions } from "./editingGate";

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
