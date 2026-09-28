/**
 * The saved-views panel's contract: the props its Chrome takes and the
 * pieces a kit fills it with.
 *
 * Every binding's saved-views Chrome lays out the same card, the same rows
 * and the same control cluster in the same order; only the components
 * differ. Rendered content is the binding's `TNode` and inline styles are its
 * `TStyle`, so a React kit and an Angular kit fill the same shapes with their
 * own types.
 */
import type { CssProperties } from "../style/cssProperties";
import type { TableLabels } from "../types";
import type { SavedView } from "./savedViewsController";
import type { SavedViewControlKey } from "./savedViewsPanelModel";

export type { SavedViewControlKey };

/**
 * One control in a row's cluster.
 *
 * The adapter maps over these rather than hand-writing five buttons, so a kit
 * cannot render four of them, order them differently, or miss the disabled
 * state on the one control this reader may not use.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface SavedViewRowControl<TNode = unknown> {
  /** Which control this is — the React key, and what a test asks for. */
  readonly key: SavedViewControlKey;
  /** The accessible name, already localized. These controls are icon-only. */
  readonly label: string;
  /** The glyph to draw inside the kit's own icon button. */
  readonly icon: TNode;
  /**
   * Run it, or `undefined` when this reader may not — a view someone else
   * owns, or a move off the end of the list. The adapter renders the control
   * disabled rather than dropping it: a button that vanishes on the last row
   * makes every row jump as the list is reordered.
   */
  readonly onPress?: () => void;
  /** Whether the toggle is currently on. Only the default control sets it. */
  readonly pressed?: boolean;
  /** Destructive, so the kit can reach for its own danger colour. */
  readonly danger?: boolean;
}

/**
 * Props an adapter's panel surface receives.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface SavedViewsPanelSurfaceProps<TNode = unknown> {
  /** The card's heading, already localized. */
  readonly title: string;
  /** Content rendered inside. */
  readonly children: TNode;
  /**
   * Anything the host wants inside the card, under the list — a note about
   * where the views came from, a link to the docs. Outside the card it reads
   * as a caption belonging to whatever follows it.
   */
  readonly footer?: TNode;
  /** Class for the element. */
  readonly className?: string;
  /** Spread onto the surface — the public part name. */
  readonly "data-adapttable-part": "saved-views-panel";
}

/**
 * Props an adapter's row receives — one saved view and its controls.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TStyle - The binding's inline style object.
 *
 * @public
 */
export interface SavedViewsPanelRowProps<
  TNode = unknown,
  TStyle = CssProperties,
> {
  /** The view's name, or the rename input while it is being edited. */
  readonly name: TNode;
  /** That name as plain text — the apply control's accessible name. */
  readonly viewName: string;
  /** Whether the name slot currently holds the rename input. */
  readonly isEditing: boolean;
  /** Whether this is the view the table opens with. */
  readonly isDefault: boolean;
  /**
   * Whether this reader may change it. A team view someone else owns is
   * read-only, and the row must SHOW that: every control arrives without a
   * handler, so a kit that renders them disabled says "not yours" rather than
   * leaving a button that silently does nothing.
   */
  readonly readOnly: boolean;
  /** The badge caption for the default view. */
  readonly defaultLabel: string;
  /** The badge caption for a view this reader cannot change. */
  readonly readOnlyLabel: string;
  /** Apply it — what clicking the name does. */
  readonly onApply: () => void;
  /** What applying is called, for the name control's tooltip. */
  readonly applyLabel: string;
  /** The cluster, in order: rename, up, down, default, delete. */
  readonly controls: readonly SavedViewRowControl<TNode>[];
  /**
   * The row's layout, owned by the chrome so a panel reads the same in every
   * kit: `row` on the row itself, `caption` on the group holding the name and
   * its badges, `controls` on the cluster, and `control` on each button. The
   * kit supplies the components; these supply the shape.
   */
  readonly layout: {
    readonly row: TStyle;
    readonly caption: TStyle;
    readonly controls: TStyle;
    readonly control: TStyle;
  };
  /** Spread onto the row — the public part name. */
  readonly "data-adapttable-part": "saved-view-row";
}

/**
 * Props an adapter's rename input receives.
 *
 * @public
 */
export interface SavedViewsPanelInputProps {
  /** Accessible name. */
  readonly label: string;
  /**
   * Attach to the underlying input element. The panel takes focus through
   * this rather than through `autoFocus`: the browser attribute fires once at
   * mount whether or not the element was the point of the interaction, which
   * is why it reads as an accessibility problem. Here the focus follows a
   * deliberate click on Rename.
   *
   * Kits whose input component hands back something other than the DOM node —
   * antd's `InputRef`, for one — unwrap it before calling this.
   */
  readonly ref: (element: HTMLInputElement | null) => void;
  /** Current value. */
  readonly value: string;
  /** Called with the new value. */
  readonly onChange: (next: string) => void;
  /** Enter commits, Escape abandons — bind both. */
  readonly onCommit: () => void;
  /** Abandons the edit. */
  readonly onCancel: () => void;
}

/**
 * Props an adapter's empty state receives.
 *
 * @public
 */
export interface SavedViewsPanelEmptyProps {
  /** Body text under the heading. */
  readonly message: string;
}

/**
 * The kit-native pieces the panel is built from.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TStyle - The binding's inline style object.
 *
 * @public
 */
export interface SavedViewsPanelSlots<TNode = unknown, TStyle = CssProperties> {
  /** The titled card. */
  readonly Surface: (props: SavedViewsPanelSurfaceProps<TNode>) => TNode;
  /** One view. */
  readonly Row: (props: SavedViewsPanelRowProps<TNode, TStyle>) => TNode;
  /** The inline rename box. */
  readonly Input: (props: SavedViewsPanelInputProps) => TNode;
  /** Shown when nothing has been saved yet. */
  readonly Empty: (props: SavedViewsPanelEmptyProps) => TNode;
}

/**
 * What the panel needs to render.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TStyle - The binding's inline style object.
 *
 * @public
 */
export interface SavedViewsPanelChromeProps<
  TNode = unknown,
  TStyle = CssProperties,
> {
  /** The saved views, in list order. */
  views: readonly SavedView[];
  /** Apply one. */
  onApply: (name: string) => void;
  /** Rename one. */
  onRename: (from: string, to: string) => void;
  /** Move one a step. */
  onMove: (name: string, delta: -1 | 1) => void;
  /** Make one the default, or clear it. */
  onSetDefault: (name: string) => void;
  /** Delete one. */
  onRemove: (name: string) => void;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** Anything of yours that belongs inside the card, under the list. */
  footer?: TNode;
  /** The kit's controls. */
  slots: SavedViewsPanelSlots<TNode, TStyle>;
  /** Class for the element. */
  className?: string;
}
