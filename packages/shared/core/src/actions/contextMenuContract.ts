/**
 * The context menu's contract: the props its Chrome takes and the pieces a
 * kit fills it with.
 *
 * Every binding's context-menu Chrome renders the same entries, in the same
 * order, inside the kit's own menu; only the components differ. Rendered
 * content is the binding's `TNode`, so a React kit and an Angular kit fill
 * the same shapes with their own nodes.
 */
import type { TableLabels } from "../types";
import type { ContextMenuItem } from "./contextMenuModel";
import type { ContextMenuPoint } from "./contextMenuOpenController";

/**
 * Props an adapter's menu surface receives.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface ContextMenuSurfaceProps<TNode = unknown> {
  /** Where the menu was opened, in viewport coordinates. */
  readonly at: ContextMenuPoint;
  /**
   * A zero-size element sitting at exactly that point.
   *
   * Every kit's menu anchors to an ELEMENT, not to coordinates — that is
   * how it decides which way to flip near an edge and where to portal to.
   * A right-click has coordinates and no element, so core puts one there.
   * Anchor the kit's menu to this and its positioning, flipping and
   * collision handling all work the way that kit's users expect.
   */
  readonly anchorRef: { readonly current: HTMLElement | null };
  /** The accessible name for the menu. */
  readonly label: string;
  /** Close it — bind to the kit's own dismiss channel. */
  readonly onClose: () => void;
  /** Where the kit must portal while fullscreen; `undefined` otherwise. */
  readonly container?: HTMLElement;
  /** The entries, already rendered through the Item and Separator slots. */
  readonly children: TNode;
  /** Class for the element. */
  readonly className?: string;
}

/**
 * Props an adapter's menu entry receives.
 *
 * @public
 */
export interface ContextMenuItemProps {
  /** The entry being rendered. */
  readonly item: ContextMenuItem;
  /**
   * Bind this rather than `item.onSelect`: it closes the menu first, which
   * an entry that opens a dialog or moves focus depends on.
   */
  readonly onSelect: () => void;
}

/**
 * Adapter-owned rendering for the context menu's Chrome.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface ContextMenuSlots<TNode = unknown> {
  /** The kit's menu, positioned at the point it was opened from. */
  readonly Surface: (props: ContextMenuSurfaceProps<TNode>) => TNode;
  /** One entry. */
  readonly Item: (props: ContextMenuItemProps) => TNode;
  /** The divider between groups of entries. */
  readonly Separator: () => TNode;
}

/**
 * What the context menu needs to render.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface ContextMenuChromeProps<TNode = unknown> {
  /** The entries. Nothing renders when this is empty. */
  items: readonly ContextMenuItem[];
  /** Where it was opened, or `null` when it is closed. */
  at: ContextMenuPoint | null;
  /** Close it, putting focus back where it came from. */
  onClose: () => void;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** A kit's own class for the menu. */
  className?: string;
  /**
   * Where to portal while the table is fullscreen.
   *
   * The Fullscreen API hides everything outside the promoted element, so a
   * menu portalled to `document.body` is mounted, focused and invisible.
   * `shell.fullscreen.container` is that element while it is on.
   */
  container?: HTMLElement;
  /** Adapter-owned visible components. */
  slots: ContextMenuSlots<TNode>;
}
