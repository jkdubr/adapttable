/**
 * The tree column's contract: the props a kit's toggle and tree cell take,
 * and the chevron a kit fills the tree Chrome with.
 *
 * Every binding's tree Chrome lays out the same chevron, leaf spacer and
 * indent; only the button differs. Rendered content is the binding's `TNode`,
 * so a React kit and an Angular kit fill the same shapes with their own types.
 */
import type { TableLabels } from "../types";
import type { TreeEntry } from "./treeRows";

/**
 * Props for a kit's `TreeToggle` — no slots on the public API.
 *
 * @public
 */
export interface TreeToggleProps<TRow> {
  /** The row's place in the tree. */
  entry: TreeEntry<TRow>;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** Open or close this node. */
  onToggle: (id: string) => void;
  /** Class for the chevron — the unstyled kit's `treeToggle` hook. */
  toggleClassName?: string;
  /** Class for a leaf's placeholder — the unstyled kit's `treeSpacer` hook. */
  spacerClassName?: string;
}

/**
 * Kit chevron the tree layout calls.
 *
 * @public
 */
export interface TreeToggleButtonProps {
  /** Accessible name for the control. */
  readonly label: string;
  /** Whether the section is open. */
  readonly expanded: boolean;
  /** Whether the node's children are still loading. */
  readonly loading: boolean;
  /** Class for the element. */
  readonly className?: string;
  /** Called when pressed. */
  readonly onClick: () => void;
}

/**
 * Kit-supplied controls for the tree toggle's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TreeToggleSlots<TNode = unknown> {
  /** Renders a button. */
  readonly Button: (props: TreeToggleButtonProps) => TNode;
}

/**
 * Props for a kit's `TreeCell` — no slots on the public API.
 *
 * @typeParam TRow - The row type.
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TreeCellProps<TRow, TNode = unknown> {
  /** The row's place in the tree; absent on a flat table. */
  entry: TreeEntry<TRow> | undefined;
  /** This cell's column. */
  columnKey: string;
  /** The column that carries the chevron. */
  treeColumnKey: string | undefined;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** Open or close this node. */
  onToggle?: (id: string) => void;
  /** Class for the wrapper — the unstyled kit's `treeCell` hook. */
  className?: string;
  /** Class for the chevron. */
  toggleClassName?: string;
  /** Class for a leaf's placeholder. */
  spacerClassName?: string;
  /** The cell's own content. */
  children: TNode;
}
