/**
 * The AND/OR filter tree's contract: the props a kit's `FilterTreeBuilder`
 * takes and the controls a kit fills its Chrome with.
 *
 * Every binding's filter-tree Chrome recurses over the same groups and
 * conditions with the same Select, Input, Button and Disclosure; only the
 * components differ. Rendered content is the binding's `TNode`, so a React
 * kit and an Angular kit fill the same shapes with their own types.
 */
import type { TableSource } from "../source/TableSource";
import type { TableLabels } from "../types";
import type { FilterDef } from "./filterDefs";
import type { FilterTypeRegistry } from "./filterRegistry";

/**
 * Class hooks the unstyled adapter maps onto `DataTableClassNames`.
 *
 * @public
 */
export interface FilterTreeClassNames {
  /** Class for the whole builder. */
  filterTree?: string;
  /** Class for an AND/OR group. */
  filterTreeGroup?: string;
  /** Class for one condition row. */
  filterTreeCondition?: string;
  /** Class for a group's action bar. */
  filterTreeActions?: string;
  /** Class for a remove button. */
  filterTreeRemove?: string;
  /** Class for the disclosure summary. */
  filterTreeSummary?: string;
  /** Class for the simple filter form. */
  filtersForm?: string;
  /** Class for one field wrapper. */
  filterField?: string;
  /** Class for a field's label. */
  filterLabel?: string;
  /** Class for a text input. */
  filterInput?: string;
  /** Class for a select. */
  filterSelect?: string;
  /** Class for the operator select. */
  filterOperator?: string;
}

/**
 * Props for an adapter `FilterTreeBuilder` — no slots on the public API.
 *
 * @public
 */
export interface FilterTreeBuilderProps<TRow> {
  /** Filter definitions the builder can offer. */
  readonly defs: readonly FilterDef<TRow>[];
  /** Reads and writes the filter tree. */
  readonly source: Pick<TableSource<TRow>, "filterTree" | "setFilterTree">;
  /** Label overrides; gaps fall back to English. */
  readonly labels?: TableLabels;
  /** Per-part classes. */
  readonly classNames?: FilterTreeClassNames;
  /** Custom filter types, beyond the built-ins. */
  readonly registry?: FilterTypeRegistry;
  /** Open Advanced on first paint. Default: open only when a tree already exists. */
  readonly defaultExpanded?: boolean;
}

/**
 * One option in a tree Select.
 *
 * @public
 */
export interface FilterTreeOption {
  /** Value stored when this option is chosen. */
  readonly value: string;
  /** Caption shown for the option. */
  readonly label: string;
}

/**
 * Kit Select the tree layout calls.
 *
 * @public
 */
export interface FilterTreeSelectProps {
  /** Accessible name for the select. */
  readonly label: string;
  /** Currently chosen value. */
  readonly value: string;
  /** Part name for the control, so styling can target it. */
  readonly part: string;
  /** Choices to offer. */
  readonly options: readonly FilterTreeOption[];
  /** Class for the select. */
  readonly className?: string;
  /** Class for the field wrapper. */
  readonly fieldClassName?: string;
  /** Class for the label. */
  readonly labelClassName?: string;
  /** Called with the chosen value. */
  readonly onChange: (value: string) => void;
}

/**
 * Kit text/number/date field the tree layout calls.
 *
 * @public
 */
export interface FilterTreeInputProps {
  /** Accessible name for the field. */
  readonly label: string;
  /** Current text. */
  readonly value: string;
  /** Which input type the value is edited with. */
  readonly type: "text" | "number" | "date";
  /** Class for the input. */
  readonly className?: string;
  /** Class for the field wrapper. */
  readonly fieldClassName?: string;
  /** Class for the label. */
  readonly labelClassName?: string;
  /** Called with the new text. */
  readonly onChange: (value: string) => void;
}

/**
 * Kit button the tree layout calls.
 *
 * @public
 */
export interface FilterTreeButtonProps {
  /** Caption and accessible name. */
  readonly label: string;
  /** Part name for the button, so styling can target it. */
  readonly part?: string;
  /** Class for the button. */
  readonly className?: string;
  /** Called when pressed. */
  readonly onClick: () => void;
}

/**
 * Kit disclosure that owns the Advanced section's visible chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface FilterTreeDisclosureProps<TNode = unknown> {
  /** Caption on the summary. */
  readonly label: string;
  /** Whether the section is open. */
  readonly expanded: boolean;
  /** Class for the disclosure. */
  readonly className?: string;
  /** Class for the summary. */
  readonly summaryClassName?: string;
  /** Content revealed when open. */
  readonly children: TNode;
  /** Called with the new open state. */
  readonly onExpandedChange: (expanded: boolean) => void;
}

/**
 * Kit-supplied controls for the filter tree's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface FilterTreeSlots<TNode = unknown> {
  /** Renders a choice control. */
  readonly Select: (props: FilterTreeSelectProps) => TNode;
  /** Renders a text, number or date field. */
  readonly Input: (props: FilterTreeInputProps) => TNode;
  /** Renders an action button. */
  readonly Button: (props: FilterTreeButtonProps) => TNode;
  /** Renders the collapsible Advanced section. */
  readonly Disclosure: (props: FilterTreeDisclosureProps<TNode>) => TNode;
}
