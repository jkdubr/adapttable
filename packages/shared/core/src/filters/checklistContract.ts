/**
 * The checklist filter's contract: the props a kit's `ChecklistFilter` takes
 * and the controls a kit fills its Chrome with.
 *
 * Every binding's checklist Chrome lays out the same search field, action
 * buttons and wrapping option checkboxes; only the components differ.
 * Rendered content is the binding's `TNode`, so a React kit and an Angular kit
 * fill the same shapes with their own types.
 */
import type { TableSource } from "../source/TableSource";
import type { TableLabels } from "../types";
import type { FilterDef } from "./filterDefs";

/**
 * Class hooks the unstyled adapter maps onto `DataTableClassNames`.
 *
 * @public
 */
export interface ChecklistClassNames {
  /** Class for the checklist as a whole. */
  filterChecklist?: string;
  /** Class for its search box. */
  filterChecklistSearch?: string;
  /** Class for its select-all and clear actions. */
  filterChecklistActions?: string;
  /** Class for the list of options. */
  filterChecklistList?: string;
  /** Class for an option's match count. */
  filterChecklistCount?: string;
  /** Class for one field wrapper. */
  filterField?: string;
  /** Class for a field's label. */
  filterLabel?: string;
  /** Class for a text input. */
  filterInput?: string;
  /** Class for the checkbox group. */
  filterCheckboxGroup?: string;
  /** Class for one checkbox. */
  filterCheckbox?: string;
}

/**
 * Props for an adapter `ChecklistFilter` — no slots on the public API.
 *
 * @public
 */
export interface ChecklistFilterProps<TRow> {
  /** The checklist filter to render. */
  readonly def: FilterDef<TRow>;
  /** Reads and writes the table's state. */
  readonly source: Pick<
    TableSource<TRow>,
    "allFilteredRows" | "extra" | "setExtra" | "facets"
  >;
  /** Label overrides; gaps fall back to English. */
  readonly labels?: TableLabels;
  /** Per-part classes. */
  readonly classNames?: ChecklistClassNames;
}

/**
 * Kit search field the checklist layout calls.
 *
 * @public
 */
export interface ChecklistSearchProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Current value. */
  readonly value: string;
  /** Class for the element. */
  readonly className?: string;
  /** Called with the new value. */
  readonly onChange: (value: string) => void;
}

/**
 * Kit button the checklist layout calls.
 *
 * @public
 */
export interface ChecklistButtonProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Called when pressed. */
  readonly onClick: () => void;
}

/**
 * Kit checkbox row the checklist layout calls.
 *
 * @public
 */
export interface ChecklistCheckboxProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** The count as text, already formatted. */
  readonly count: string;
  /** Whether the box is ticked. */
  readonly checked: boolean;
  /** Class for the element. */
  readonly className?: string;
  /** Class for the match count. */
  readonly countClassName?: string;
  /** Called with the new value. */
  readonly onChange: (checked: boolean) => void;
}

/**
 * Kit-supplied controls for the checklist's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface ChecklistSlots<TNode = unknown> {
  /** Renders the search box. */
  readonly Search: (props: ChecklistSearchProps) => TNode;
  /** Renders one action button. */
  readonly Button: (props: ChecklistButtonProps) => TNode;
  /** Renders one option's checkbox. */
  readonly Checkbox: (props: ChecklistCheckboxProps) => TNode;
}
