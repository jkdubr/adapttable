/**
 * Editable-cell Chrome: activation, editor focus, validation and save
 * notices — structure and wiring only. Every visible control is the kit's.
 *
 * Commits go through core's {@link editableCellController} /
 * {@link resolveCommitValue} so `parseValue`, validators, async saves and
 * lifecycle observers all run.
 */
import {
  booleanDraft,
  type CellConflictAsk,
  controllerConflictAsk,
  editableCellErrorId,
  editableCellPresentation,
  editorBusyProps,
  editorKeyRestoresFocus,
  editorValidationProps,
  formatMultiDraft,
  isEditActivateKey,
  stopEditKeys,
} from "@adapttable/core";
import type {
  EditableCellActivateProps as NeutralEditableCellActivateProps,
  EditableCellButtonProps,
} from "@adapttable/core/binding";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  signal,
  type Type,
} from "@angular/core";

import type { ColumnDef } from "../columnDef";
import { AdaptControl } from "../control";
import {
  editableCellController,
  type EditableCellEditing,
  focusEditorOnMount,
  stopCellEditKeyboard,
} from "./editableCellController";

export type { EditableCellButtonProps } from "@adapttable/core/binding";
export { editorBusyProps, editorValidationProps, stopEditKeys };

/**
 * Kit activate control the gate calls while the cell is idle.
 *
 * @public
 */
export type EditableCellActivateProps =
  NeutralEditableCellActivateProps<unknown>;

/**
 * Kit-supplied controls for {@link AdaptEditableCellGate}.
 *
 * @public
 */
export interface EditableCellSlots {
  /** Idle activate control. */
  readonly Activate: Type<unknown>;
  /** Conflict / undo button. */
  readonly Button: Type<unknown>;
}

/**
 * Props for a kit-native editor while a cell is active.
 *
 * @public
 */
export interface EditableCellEditorCtrl {
  /** The value being edited, as text. */
  draft: string;
  /** Replaces the draft on every keystroke. */
  setDraft: (value: string) => void;
  /** Handles Enter, Escape and Tab for the editor. */
  onEditorKeyDown: (event: {
    key: string;
    preventDefault: () => void;
    shiftKey?: boolean;
  }) => void;
  /** Commits the draft when focus leaves the editor. */
  commitOnBlur: () => void;
  /** The editor shape this column declared. */
  editor: NonNullable<ReturnType<typeof editableCellController>["editor"]>;
  /** Choices for a select editor, empty for other shapes. */
  selectOptions: ReturnType<typeof editableCellController>["selectOptions"];
  /** A validator's message for this cell, when the last commit was rejected. */
  error?: string;
  /** Whether an async validator is still deciding. */
  validating: boolean;
  /** `id` of the element holding the message. */
  errorId: string;
  /** Attach as the editor's focus callback so the table decides focus. */
  focusRef: (node: { focus: () => void } | null) => void;
  /** A live row changed under this editor. */
  conflict?: boolean;
}

/**
 * Props for {@link AdaptCellConflictNotice}.
 *
 * @public
 */
export interface CellConflictNoticeProps {
  /** The question, or `undefined` when this cell is not being asked about. */
  readonly ask?: CellConflictAsk;
  /** Labels for the notice — already resolved. */
  readonly labels?: NonNullable<EditableCellEditing<never>["conflictLabels"]>;
  /** Id the editor points at with `aria-describedby`. */
  readonly errorId: string;
  /** Class for the notice. */
  readonly errorClassName?: string;
  /** The kit's components for each part. */
  readonly slots: EditableCellSlots;
}

/**
 * Toggle a checkbox editor and commit in the same gesture.
 *
 * @public
 */
export function commitBooleanDraft(
  ctrl: EditableCellEditorCtrl,
  checked: boolean
): void {
  ctrl.setDraft(booleanDraft(checked));
  ctrl.commitOnBlur();
}

/**
 * The draft for a native `<select multiple>`'s current selection.
 *
 * @public
 */
export function multiDraftFromSelect(select: HTMLSelectElement): string {
  return formatMultiDraft(
    [...select.selectedOptions].map((option) => option.value)
  );
}

/**
 * The notice one cell shows when its stored value moved under the editor.
 *
 * @public
 */
@Component({
  selector: "adapt-cell-conflict-notice",
  imports: [AdaptControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let currentAsk = ask();
    @let currentLabels = labels();
    <span
      [attr.id]="errorId()"
      role="alert"
      data-adapttable-part="edit-cell-conflict"
      data-conflict=""
      [class]="errorClassName()"
    >
      <span data-adapttable-part="edit-cell-conflict-message">{{
        currentLabels.message
      }}</span>
      <span data-adapttable-part="edit-cell-incoming" style="display: block">{{
        currentLabels.theirsValue(currentAsk.incomingValue)
      }}</span>
      <ng-container
        [adaptControl]="slots().Button"
        [adaptControlProps]="keepProps()"
      />
      <ng-container
        [adaptControl]="slots().Button"
        [adaptControlProps]="takeProps()"
      />
    </span>
  `,
})
export class AdaptCellConflictNotice {
  /** The question. */
  readonly ask = input.required<CellConflictAsk>();
  /** Labels for the notice. */
  readonly labels =
    input.required<NonNullable<EditableCellEditing<never>["conflictLabels"]>>();
  /** Id the editor points at. */
  readonly errorId = input.required<string>();
  /** Class for the notice. */
  readonly errorClassName = input<string>();
  /** The kit's controls. */
  readonly slots = input.required<EditableCellSlots>();

  private readonly holdFocus = (event: { preventDefault: () => void }) => {
    event.preventDefault();
  };

  protected readonly keepProps = computed((): EditableCellButtonProps => {
    const ask = this.ask();
    const labels = this.labels();
    return {
      label: labels.keepMine,
      part: "edit-cell-keep-mine",
      onMouseDown: this.holdFocus,
      onClick: (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        ask.keep();
      },
    };
  });

  protected readonly takeProps = computed((): EditableCellButtonProps => {
    const ask = this.ask();
    const labels = this.labels();
    return {
      label: labels.takeTheirs,
      part: "edit-cell-take-theirs",
      onMouseDown: this.holdFocus,
      onClick: (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        ask.take();
      },
    };
  });
}

/**
 * Pass-through host that renders a text display for tests and kits that
 * hand a string (or any printable) as the idle cell content.
 *
 * @internal
 */
@Component({
  selector: "adapt-editable-cell-display",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `{{ props() }}`,
})
export class AdaptEditableCellDisplay {
  readonly props = input.required<unknown>();
}

/**
 * Opt-in cell wrapper: plain display when editing is off; double-click /
 * Enter / F2 to activate; kit supplies the editor via `editor`.
 *
 * Commits run through core's editableCellController so parseValue, validate,
 * async saves and lifecycle observers fire.
 *
 * @public
 */
@Component({
  selector: "adapt-editable-cell-gate",
  imports: [AdaptControl, AdaptCellConflictNotice, AdaptEditableCellDisplay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let p = presentation();
    @if (p === "display") {
      <adapt-editable-cell-display [props]="display()" />
    } @else if (p === "editor" || p === "custom-editor") {
      <ng-container
        [adaptControl]="editor()"
        [adaptControlProps]="editorCtrl()"
      />
      @if (conflictAsk(); as ask) {
        @if (editing()?.conflictLabels; as conflictLabels) {
          <adapt-cell-conflict-notice
            [ask]="ask"
            [labels]="conflictLabels"
            [errorId]="errorId()"
            [errorClassName]="errorClassName()"
            [slots]="slots()"
          />
        }
      }
      @if (
        conflictAsk() === undefined &&
        ctrl().error !== undefined &&
        kitRendersError() !== true
      ) {
        <span
          [attr.id]="errorId()"
          role="alert"
          data-adapttable-part="edit-cell-error"
          [class]="errorClassName()"
        >
          {{ ctrl().error }}
        </span>
      }
    } @else {
      <ng-container
        [adaptControl]="slots().Activate"
        [adaptControlProps]="activateProps()"
      />
      @if (ctrl().saveFailure; as failure) {
        <span
          role="alert"
          data-adapttable-part="edit-cell-save-error"
          [class]="saveErrorClassName()"
        >
          {{ failure.message }}
          @if (ctrl().canRollback && undoLabel() !== undefined) {
            <ng-container
              [adaptControl]="slots().Button"
              [adaptControlProps]="rollbackProps()"
            />
          }
        </span>
      }
    }
  `,
})
export class AdaptEditableCellGate<TRow> {
  /** Cell-editing state; the gate is a pass-through when absent. */
  readonly editing = input<EditableCellEditing<TRow>>();
  /** The row being rendered. */
  readonly row = input.required<TRow>();
  /** The column being rendered. */
  readonly column = input.required<ColumnDef<TRow>>();
  /** Identity of the row being edited. */
  readonly rowId = input.required<string>();
  /** The rendered rows. */
  readonly rows = input.required<readonly TRow[]>();
  /** Visible columns, in order. */
  readonly columns = input.required<readonly ColumnDef<TRow>[]>();
  /** Row identity function. */
  readonly rowKey = input.required<(row: TRow) => string>();
  /** Accessible name for the activate control. */
  readonly editLabel = input.required<string>();
  /** Optional class for the activate button. */
  readonly activateClassName = input<string>();
  /** Optional class for the validation message. */
  readonly errorClassName = input<string>();
  /** Optional class for a failed save's message. */
  readonly saveErrorClassName = input<string>();
  /** Optional class for the undo control beside it. */
  readonly rollbackClassName = input<string>();
  /** Label for the undo control a failed save offers. */
  readonly undoLabel = input<string>();
  /** Set when the kit's own input renders the message. */
  readonly kitRendersError = input<boolean>();
  /** What the cell shows when it is not being edited. */
  readonly display = input.required<unknown>();
  /** Kit editor component — receives {@link EditableCellEditorCtrl} as props. */
  readonly editor = input.required<Type<unknown>>();
  /** Kit activate control and conflict / undo buttons. */
  readonly slots = input.required<EditableCellSlots>();

  private readonly injector = inject(Injector);
  private readonly restoreFocus = signal(false);
  private activateEl: HTMLButtonElement | null = null;

  protected readonly ctrl = computed(() =>
    editableCellController({
      editing: this.editing(),
      row: this.row(),
      column: this.column(),
      rowId: this.rowId(),
      rows: this.rows(),
      columns: this.columns(),
      rowKey: this.rowKey(),
    })
  );

  protected readonly presentation = computed(() =>
    editableCellPresentation(this.editing(), this.rowId(), this.ctrl())
  );

  protected readonly errorId = computed(() =>
    editableCellErrorId(this.rowId(), this.column().key)
  );

  protected readonly conflictAsk = computed(() =>
    controllerConflictAsk(this.ctrl())
  );

  protected readonly activateProps = computed((): EditableCellActivateProps => {
    const ctrl = this.ctrl();
    return {
      title: this.editLabel(),
      className: this.activateClassName(),
      saveStatus: ctrl.saveStatus,
      dirty: ctrl.isDirty,
      activateRef: (node: HTMLButtonElement | null) => {
        this.activateEl = node;
      },
      display: this.display(),
      onDoubleClick: (event: {
        preventDefault: () => void;
        stopPropagation: () => void;
      }) => {
        event.preventDefault();
        event.stopPropagation();
        ctrl.begin();
      },
      onClick: (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
      },
      onKeyDown: (event: {
        key: string;
        preventDefault: () => void;
        stopPropagation: () => void;
      }) => {
        if (isEditActivateKey(event.key)) {
          event.preventDefault();
          stopCellEditKeyboard(event);
          ctrl.begin();
        }
      },
    };
  });

  protected readonly editorCtrl = computed((): EditableCellEditorCtrl => {
    const ctrl = this.ctrl();
    const errorId = this.errorId();
    return {
      draft: ctrl.draft,
      setDraft: ctrl.setDraft,
      onEditorKeyDown: (event: {
        key: string;
        preventDefault: () => void;
        shiftKey?: boolean;
      }) => {
        if (editorKeyRestoresFocus(event.key)) {
          this.restoreFocus.set(true);
        }
        ctrl.onEditorKeyDown(event);
      },
      commitOnBlur: ctrl.commitOnBlur,
      editor: ctrl.editor!,
      selectOptions: ctrl.selectOptions,
      error: ctrl.error,
      validating: ctrl.validating,
      errorId,
      conflict: ctrl.conflict !== undefined,
      focusRef: focusEditorOnMount,
    };
  });

  protected readonly rollbackProps = computed((): EditableCellButtonProps => {
    const ctrl = this.ctrl();
    return {
      label: this.undoLabel() ?? "",
      part: "edit-cell-rollback",
      className: this.rollbackClassName(),
      onClick: (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        ctrl.rollback();
      },
    };
  });

  constructor() {
    effect(
      () => {
        const shouldRestore = this.restoreFocus();
        const mode = this.ctrl().mode;
        if (!shouldRestore || mode !== "activatable") return;
        this.restoreFocus.set(false);
        queueMicrotask(() => this.activateEl?.focus());
      },
      { injector: this.injector }
    );
  }
}
