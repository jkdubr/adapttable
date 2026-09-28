/**
 * The grouping panel's contract: the props each kit-owned piece of the
 * grouping strip takes, and the pieces a kit fills the panel Chrome with.
 *
 * Every binding's grouping Chrome lays out the same chips, carets, selects and
 * aggregation controls; only the components differ. Rendered content is the
 * binding's `TNode`, key events its `TKeyboardEvent` and drag events its
 * `TDragEvent`, and the column definitions are the binding's own `TColumn`, so
 * a React kit and an Angular kit fill the same shapes with their own types.
 */
import type { Direction, TableLabels } from "../types";
import type {
  GroupingChipKeyboardProps,
  GroupingDragProps,
  GroupingDropProps,
  GroupingPanelState,
} from "./groupingPanelModel";

/** One localized select option in the grouping panel. @public */
export interface GroupingPanelOption {
  /** State value written when selected. */
  value: string;
  /** Localized visible option text. */
  label: string;
}

/**
 * Props for the kit-owned grouping panel surface.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TDragEvent - The binding's drag event.
 *
 * @public
 */
export interface GroupingPanelSurfaceProps<
  TNode = unknown,
  TDragEvent = DragEvent,
> {
  /** Grouping controls assembled by core. */
  children: TNode;
  /** Localized visible and accessible surface label. */
  label: string;
  /** Whether controls use the compact mobile treatment. */
  mobile: boolean;
  /** Logical text direction. */
  dir?: Direction;
  /**
   * A dragged field arriving over the strip. The panel is mostly free space
   * once a few chips are in it, and that space is where a reader aims: a drop
   * anywhere on it that no caret or chip already answered adds the field at
   * the end. Spread all four onto the same element as the part name.
   */
  onDragEnter?: (event: TDragEvent) => void;
  /** The field still over the strip — what accepts the drop. */
  onDragOver?: (event: TDragEvent) => void;
  /** The field leaving the strip. */
  onDragLeave?: (event: TDragEvent) => void;
  /** The field let go over the strip. */
  onDrop?: (event: TDragEvent) => void;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-panel";
}

/**
 * Props for one kit-owned insertion target.
 *
 * @typeParam TDragEvent - The binding's drag event.
 *
 * @public
 */
export interface GroupingPanelDropZoneProps<TDragEvent = DragEvent> {
  /** Localized drop instruction and accessible name. */
  label: string;
  /** Whether this is the panel's empty-state target. */
  empty: boolean;
  /** Whether a dragged field is currently over this target. */
  active: boolean;
  /**
   * Whether a grouping drag is in flight anywhere in the strip. A boundary
   * between two chips is a caret at rest; while something is being dragged it
   * has to be big enough to aim at.
   */
  dragging: boolean;
  /** Native drag handlers supplied by core. */
  dropProps: GroupingDropProps<TDragEvent>;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-drop-zone";
}

/**
 * Props for one kit-owned active grouping chip.
 *
 * @typeParam TKeyboardEvent - The binding's key event.
 * @typeParam TDragEvent - The binding's drag event.
 *
 * @public
 */
export interface GroupingPanelChipProps<
  TKeyboardEvent = KeyboardEvent,
  TDragEvent = DragEvent,
> {
  /** Display name of the grouped column. */
  label: string;
  /** One-based nesting position. */
  level: number;
  /** Native drag handlers supplied by core. */
  dragProps: GroupingDragProps<TDragEvent>;
  /** Keyboard move and remove handlers supplied by core. */
  keyboardProps: GroupingChipKeyboardProps<TKeyboardEvent>;
  /** Remove this field from grouping. */
  onRemove: () => void;
  /** Localized accessible name for the remove control. */
  removeLabel: string;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-chip";
}

/** Props for a kit-owned grouping panel select. @public */
export interface GroupingPanelSelectProps {
  /** Localized visible and accessible select label. */
  label: string;
  /** Controlled selected value. */
  value: string;
  /** Localized choices. */
  options: readonly GroupingPanelOption[];
  /** Commit one selected value. */
  onChange: (value: string) => void;
  /** Whether the source cannot accept this selection. */
  disabled?: boolean;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-add" | "grouping-aggregation-operation";
}

/**
 * Props for one kit-owned active aggregation.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface GroupingPanelAggregationItemProps<TNode = unknown> {
  /** Display name of the aggregated column. */
  label: string;
  /**
   * Whether the app owns this aggregate. A read-only item carries no
   * operation list and no remove control, because neither would do anything.
   */
  readOnly: boolean;
  /** Localized note naming who owns a read-only aggregate. */
  readOnlyLabel: string;
  /** The operation control and remove control, when the reader has them. */
  children: TNode;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-aggregation-item";
}

/** Props for the kit-owned control that removes one aggregation. @public */
export interface GroupingPanelAggregationRemoveProps {
  /** Localized accessible name. */
  label: string;
  /** Take this column's aggregation away. */
  onRemove: () => void;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-aggregation-remove";
}

/** One column offered by the aggregation picker. @public */
export interface GroupingPanelChecklistOption {
  /** The column key. */
  value: string;
  /** The column's display name. */
  label: string;
  /** Whether it is aggregated right now. */
  checked: boolean;
}

/** Props for the kit-owned multi-select that adds aggregations. @public */
export interface GroupingPanelChecklistProps {
  /** Localized visible and accessible label. */
  label: string;
  /** Every eligible column, checked when it is already aggregated. */
  options: readonly GroupingPanelChecklistOption[];
  /** Turn one column's aggregation on or off. */
  onToggle: (value: string, checked: boolean) => void;
  /** Whether the source cannot accept a change. */
  disabled?: boolean;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-aggregation-add";
}

/** Props for the kit-owned button that restores declared aggregations. @public */
export interface GroupingPanelRestoreProps {
  /** Localized visible and accessible label. */
  label: string;
  /** Whether the reader cannot put the declared setup back. */
  disabled: boolean;
  /** Put the declared setup back. */
  onRestore: () => void;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-aggregations-restore";
}

/**
 * Props for the chip-only drop target that ungroups a field.
 *
 * @typeParam TDragEvent - The binding's drag event.
 *
 * @public
 */
export interface GroupingPanelRemoveZoneProps<TDragEvent = DragEvent> {
  /** Localized visible and accessible target label. */
  label: string;
  /** Whether a dragged chip is currently over this target. */
  active: boolean;
  /** Native drop handlers supplied by core. */
  dropProps: GroupingDropProps<TDragEvent>;
  /** Stable styling and test part name. */
  "data-adapttable-part": "grouping-remove-zone";
}

/**
 * Kit-native visible pieces required by the grouping panel.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TKeyboardEvent - The binding's key event.
 * @typeParam TDragEvent - The binding's drag event.
 *
 * @public
 */
export interface GroupingPanelSlots<
  TNode = unknown,
  TKeyboardEvent = KeyboardEvent,
  TDragEvent = DragEvent,
> {
  /** Outer panel surface. */
  Surface: (props: GroupingPanelSurfaceProps<TNode, TDragEvent>) => TNode;
  /** One insertion boundary. */
  DropZone: (props: GroupingPanelDropZoneProps<TDragEvent>) => TNode;
  /** One active grouping field. */
  Chip: (props: GroupingPanelChipProps<TKeyboardEvent, TDragEvent>) => TNode;
  /** Add-field or aggregation select. */
  Select: (props: GroupingPanelSelectProps) => TNode;
  /** Chip-only drag-to-ungroup target. */
  RemoveZone: (props: GroupingPanelRemoveZoneProps<TDragEvent>) => TNode;
  /** One active aggregation: a column, its operation, and its remove. */
  AggregationItem: (props: GroupingPanelAggregationItemProps<TNode>) => TNode;
  /** The control that takes one aggregation away. */
  AggregationRemove: (props: GroupingPanelAggregationRemoveProps) => TNode;
  /** The multi-select that adds and removes aggregated columns. */
  AggregationPicker: (props: GroupingPanelChecklistProps) => TNode;
  /** The button that restores the app's declared aggregations. */
  AggregationRestore: (props: GroupingPanelRestoreProps) => TNode;
}

/**
 * State and table context supplied to an adapter's grouping-panel slot.
 *
 * @typeParam TColumn - The binding's column definition.
 *
 * @public
 */
export interface GroupingPanelSlotProps<TColumn = unknown> {
  /** Live URL-backed grouping interactions and values. */
  state: GroupingPanelState;
  /** Every table column available for grouping or aggregation. */
  columns: readonly TColumn[];
  /** Fully resolved localized table labels. */
  labels: Required<TableLabels>;
  /** Whether the table is rendering its mobile layout. */
  mobile: boolean;
  /** Logical text direction. */
  dir?: Direction;
}
