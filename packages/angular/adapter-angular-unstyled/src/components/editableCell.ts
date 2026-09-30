/**
 * Native editable cell — the kit fill for {@link EDITABLE_CELL}.
 */
import {
  AdaptEditableCellGate,
  type ColumnDef,
  commitBooleanDraft,
  type EditableCellActivateProps,
  type EditableCellButtonProps,
  type EditableCellEditing,
  type EditableCellEditorCtrl,
  type EditableCellSlotProps,
  type EditableCellSlots,
  editorInputType,
  editorValidationProps,
  isBooleanEditor,
  isDraftChecked,
  isMultiSelectEditor,
  isSelectEditor,
  multiDraftFromSelect,
  readMultiDraft,
  resolveEditableCellDisplay,
  stopCellEditKeyboard,
  stopEditKeys,
} from "@adapttable/angular";
import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  viewChild,
} from "@angular/core";

@Component({
  selector: "adapt-edit-cell-activate",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let p = props();
    <button
      #btn
      type="button"
      data-adapttable-part="edit-cell-activate"
      [attr.title]="p.title"
      [attr.data-dirty]="p.dirty ? '' : null"
      [attr.data-save]="p.saveStatus ?? null"
      [attr.aria-busy]="p.saveStatus === 'saving' ? true : null"
      [class]="p.className"
      style="all: unset; box-sizing: border-box; display: block; width: 100%; cursor: text; text-align: inherit"
      (dblclick)="p.onDoubleClick($event)"
      (click)="p.onClick($event)"
      (keydown)="p.onKeyDown($event)"
    >
      {{ p.display }}
    </button>
  `,
})
class AdaptEditCellActivate implements AfterViewInit {
  readonly props = input.required<EditableCellActivateProps>();
  private readonly btn = viewChild<ElementRef<HTMLButtonElement>>("btn");
  ngAfterViewInit(): void {
    this.props().activateRef(this.btn()?.nativeElement ?? null);
  }
}

@Component({
  selector: "adapt-edit-cell-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let p = props();
    <button
      type="button"
      [attr.data-adapttable-part]="p.part"
      [class]="p.className"
      (mousedown)="p.onMouseDown?.($event)"
      (click)="p.onClick($event)"
    >
      {{ p.label }}
    </button>
  `,
})
class AdaptEditCellButton {
  readonly props = input.required<EditableCellButtonProps>();
}

/**
 * The native editor a cell opens: a text, number or date input, a checkbox,
 * or a select, focused and committed as the editing controller says.
 *
 * @public
 */
@Component({
  selector: "adapt-native-cell-editor",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let p = props();
    @let v = editorValidationProps(p);
    @if (isBooleanEditor(p.editor)) {
      <input
        #el
        data-adapttable-part="edit-cell-editor"
        type="checkbox"
        [attr.aria-label]="p.label"
        [attr.aria-invalid]="v['aria-invalid'] ?? null"
        [attr.aria-describedby]="v['aria-describedby'] ?? null"
        [attr.data-conflict]="v['data-conflict'] ?? null"
        [checked]="isDraftChecked(p.draft)"
        (change)="commitBoolean($any($event.target).checked)"
        (keydown)="onKeyDown($event)"
      />
    } @else if (isMultiSelectEditor(p.editor)) {
      <select
        #el
        data-adapttable-part="edit-cell-editor"
        multiple
        [attr.aria-label]="p.label"
        [attr.aria-invalid]="v['aria-invalid'] ?? null"
        [attr.aria-describedby]="v['aria-describedby'] ?? null"
        (change)="p.setDraft(multiDraftFromSelect($any($event.target)))"
        (keydown)="onKeyDown($event)"
        (blur)="p.commitOnBlur()"
      >
        @for (option of p.selectOptions; track option.value) {
          <option
            [value]="option.value"
            [selected]="readMultiDraft(p.draft).includes(option.value)"
          >
            {{ option.label }}
          </option>
        }
      </select>
    } @else if (isSelectEditor(p.editor)) {
      <select
        #el
        data-adapttable-part="edit-cell-editor"
        [attr.aria-label]="p.label"
        [attr.aria-invalid]="v['aria-invalid'] ?? null"
        [attr.aria-describedby]="v['aria-describedby'] ?? null"
        [value]="p.draft"
        (change)="p.setDraft($any($event.target).value)"
        (keydown)="onKeyDown($event)"
        (blur)="p.commitOnBlur()"
      >
        @for (option of p.selectOptions; track option.value) {
          <option [value]="option.value" [selected]="option.value === p.draft">
            {{ option.label }}
          </option>
        }
      </select>
    } @else {
      <input
        #el
        data-adapttable-part="edit-cell-editor"
        [attr.aria-label]="p.label"
        [attr.aria-invalid]="v['aria-invalid'] ?? null"
        [attr.aria-describedby]="v['aria-describedby'] ?? null"
        [type]="editorInputType(p.editor)"
        [value]="p.draft"
        (input)="p.setDraft($any($event.target).value)"
        (keydown)="onKeyDown($event)"
        (blur)="p.commitOnBlur()"
      />
    }
  `,
})
export class AdaptNativeCellEditor implements AfterViewInit {
  readonly props = input.required<EditableCellEditorCtrl>();
  private readonly el = viewChild<ElementRef<HTMLElement>>("el");

  protected readonly editorValidationProps = editorValidationProps;
  protected readonly isBooleanEditor = isBooleanEditor;
  protected readonly isDraftChecked = isDraftChecked;
  protected readonly isMultiSelectEditor = isMultiSelectEditor;
  protected readonly isSelectEditor = isSelectEditor;
  protected readonly editorInputType = editorInputType;
  protected readonly readMultiDraft = readMultiDraft;
  protected readonly multiDraftFromSelect = multiDraftFromSelect;

  ngAfterViewInit(): void {
    this.props().focusRef(this.el()?.nativeElement ?? null);
  }

  protected commitBoolean(checked: boolean): void {
    commitBooleanDraft(this.props(), checked);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    this.props().onEditorKeyDown(event);
    // Stop at the editor so composed cellNavigation does not steal arrow
    // keys from the caret (core's stopCellEditKeyboard).
    stopCellEditKeyboard(event);
    stopEditKeys(event);
  }
}

const SLOTS: EditableCellSlots = {
  Activate: AdaptEditCellActivate,
  Button: AdaptEditCellButton,
};

/**
 * Opt-in editable cell — pass-through when `editing` is omitted. Fills
 * {@link EDITABLE_CELL}.
 *
 * @public
 */
@Component({
  selector: "adapt-editable-cell",
  imports: [AdaptEditableCellGate],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents" },
  template: `
    @let p = props();
    <adapt-editable-cell-gate
      [editing]="editing()"
      [row]="p.row"
      [column]="column()"
      [rowId]="p.rowId"
      [rows]="p.rows"
      [columns]="columns()"
      [rowKey]="p.rowKey"
      [editLabel]="p.editLabel"
      [undoLabel]="p.undoLabel"
      [display]="resolvedDisplay()"
      [editor]="editor"
      [slots]="slots"
    />
  `,
})
export class AdaptEditableCell<TRow> {
  /** Slot props from the table's editable-cell fill. */
  readonly props = input.required<EditableCellSlotProps<TRow>>();

  protected readonly editor = AdaptNativeCellEditor;
  protected readonly slots = SLOTS;

  /**
   * Editing bundle from the slot — typed for the gate.
   *
   * @internal
   */
  protected editing(): EditableCellEditing<TRow> | undefined {
    return this.props().editing as EditableCellEditing<TRow> | undefined;
  }

  /**
   * Column from the slot — typed for the gate.
   *
   * @internal
   */
  protected column(): ColumnDef<TRow> {
    return this.props().column;
  }

  /**
   * Columns from the slot — typed for the gate.
   *
   * @internal
   */
  protected columns(): readonly ColumnDef<TRow>[] {
    return this.props().columns;
  }

  /**
   * Resolved display for the activate control — the precomputed display, the
   * column's accessor, or nothing when neither is set.
   *
   * @internal
   */
  protected resolvedDisplay(): unknown {
    const p = this.props();
    return resolveEditableCellDisplay(
      p.display,
      p.column,
      () => undefined,
      p.row
    );
  }
}

export type { EditableCellEditing };
