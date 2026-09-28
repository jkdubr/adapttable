/**
 * The Table Assistant's contract: the props a kit's assistant takes and the
 * controls a kit must supply for the panel.
 *
 * Core draws no button, no input and no surface: every visible control here
 * is a required slot, so a Mantine table's assistant is made of Mantine
 * components and an antd table's is made of antd ones. Rendered content is
 * the binding's `TNode`, key events its `TKeyboardEvent` and inline styles
 * its `TStyle`, so a React kit and an Angular kit fill the same shapes with
 * their own types.
 */
import type { AgentApprovalPending } from "../approval/types";
import type { CssProperties } from "../style/cssProperties";
import type { TableLabels } from "../types";
import type {
  TableAssistantMessageView,
  TableAssistantView,
} from "./assistantView";
import type { SpeechInputHandle } from "./speechView";

/**
 * One speaker's mark: a picture, or a name to take initials from.
 *
 * A string is a name — "Ada Lovelace" is drawn as `AL`, the circle every
 * product uses for a person it has no photograph of. Anything else is
 * rendered as given: an `<img>`, a kit's own Avatar, whatever the host has.
 * The panel owns the circle, the size and the ground either way, so a host
 * supplies the face and nothing else.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export type TableAssistantFace<TNode = unknown> = Exclude<TNode, undefined>;

/**
 * The marks beside what each speaker said.
 *
 * Omit either and that speaker keeps the built-in face.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TableAssistantAvatars<TNode = unknown> {
  /** Beside the assistant's replies. */
  readonly assistant?: TableAssistantFace<TNode>;
  /** Beside what the reader said. */
  readonly user?: TableAssistantFace<TNode>;
}

/**
 * A kit button.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TableAssistantButtonProps<TNode = unknown> {
  /** Accessible name. Also the visible text unless `children` is given. */
  readonly label: string;
  /** Part name, so styling and tests can target this element. */
  readonly part: string;
  readonly className?: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  /** How prominent this control is in the kit's own vocabulary. */
  readonly variant?: "primary" | "secondary" | "subtle";
  /** Visible content, when it differs from the accessible name. */
  readonly children?: TNode;
  /** Set when the control owns an expandable region. */
  readonly expanded?: boolean;
  /**
   * A leading glyph. With {@link TableAssistantButtonProps.iconOnly} it is
   * the whole visible control and `label` becomes the accessible name only.
   */
  readonly icon?: TNode;
  /** Draw the icon alone. The kit still exposes `label` to assistive tech. */
  readonly iconOnly?: boolean;
  /** Hover/focus description, when the kit has a tooltip of its own. */
  readonly tooltip?: string;
}

/**
 * The floating conversation window.
 *
 * Nonmodal and out of the document flow: opening it must not resize, squeeze
 * or move the table behind it, and the reader can still operate that table
 * while it is open. The kit supplies the surface — its own elevation, radius
 * and border — and the chrome positions it.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TStyle - The binding's inline style bag.
 *
 * @public
 */
export interface TableAssistantWindowProps<
  TNode = unknown,
  TStyle = CssProperties,
> {
  readonly label: string;
  readonly part: string;
  readonly className?: string;
  /** Inline styles the chrome computes for placement and size. */
  readonly style?: TStyle;
  readonly children: TNode;
}

/**
 * The kit's own multiline input.
 *
 * @typeParam TKeyboardEvent - The binding's key event (React's synthetic
 *   event in React, the DOM event elsewhere).
 *
 * @public
 */
export interface TableAssistantComposerProps<TKeyboardEvent = KeyboardEvent> {
  readonly label: string;
  readonly placeholder: string;
  readonly part: string;
  readonly className?: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly onChange: (value: string) => void;
  /**
   * Key handling the chrome owns — Enter to send, Shift+Enter for a newline,
   * and an IME composition left alone. A kit must forward this untouched.
   */
  readonly onKeyDown: (event: TKeyboardEvent) => void;
}

/** The compact connection indicator. @public */
export interface TableAssistantBadgeProps {
  readonly label: string;
  readonly part: string;
  readonly className?: string;
  /** Which of the kit's own tones this state deserves. */
  readonly tone: "neutral" | "busy" | "warning" | "danger";
}

/**
 * The desktop surface that sits beside the table.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TableAssistantPanelProps<TNode = unknown> {
  readonly label: string;
  readonly part: string;
  readonly className?: string;
  readonly children: TNode;
}

/**
 * The modal surface a narrow viewport gets instead.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TableAssistantSheetProps<TNode = unknown> {
  readonly label: string;
  readonly part: string;
  readonly className?: string;
  readonly open: boolean;
  readonly onClose: () => void;
  /**
   * Writing direction for the surface.
   *
   * Every kit draws this one through a portal, which lands at the document
   * root and never sees the direction of the subtree the assistant lives in.
   * Passed explicitly for that reason: without it a right-to-left table opens
   * a left-to-right sheet, with the text in one direction and the layout in
   * the other. A kit applies it to the element it portals.
   */
  readonly dir?: "ltr" | "rtl";
  readonly children: TNode;
}

/**
 * One entry in the examples menu.
 *
 * Already in the reader's language — the chrome hands the kit words, never a
 * suggestion object, so nothing about the assistant's shape leaks into a
 * kit's menu.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TableAssistantMenuItem<TNode = unknown> {
  /** Stable identity, handed back to {@link TableAssistantMenuProps.onSelect}. */
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly icon?: TNode;
  readonly part: string;
}

/**
 * A menu hung off one trigger.
 *
 * Items rather than children, because a kit's menu wants its own item
 * component — `Menu.Item`, `MenuItem`, `DropdownMenu.Item` — and children
 * would force one kit's markup through another kit's menu. The kit owns the
 * trigger, the surface, the placement and the keyboard; the chrome owns only
 * what the entries say.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TableAssistantMenuProps<TNode = unknown> {
  /** Accessible name of the trigger, and its tooltip. */
  readonly label: string;
  /** Part name for the trigger. */
  readonly part: string;
  readonly className?: string;
  /** The trigger's glyph. */
  readonly icon?: TNode;
  readonly disabled?: boolean;
  readonly items: readonly TableAssistantMenuItem<TNode>[];
  readonly onSelect: (id: string) => void;
  /**
   * How tall the list may grow before it scrolls inside itself.
   *
   * A table can offer a dozen shortcuts, and a menu that grows to fit them
   * all runs off the panel — past the composer it was opened from, and on a
   * short viewport off the screen. The kit applies this to its own surface,
   * because only the kit knows which element there scrolls.
   */
  readonly maxHeight?: string;
}

/**
 * Every control the assistant's Chrome needs from a kit.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 * @typeParam TKeyboardEvent - The binding's key event.
 * @typeParam TStyle - The binding's inline style bag.
 *
 * @public
 */
export interface TableAssistantSlots<
  TNode = unknown,
  TKeyboardEvent = KeyboardEvent,
  TStyle = CssProperties,
> {
  /** The nonmodal desktop surface. */
  readonly Panel: (props: TableAssistantPanelProps<TNode>) => TNode;
  /** The modal narrow-viewport surface, with the kit's own focus trap. */
  readonly Sheet: (props: TableAssistantSheetProps<TNode>) => TNode;
  /** Every button: launcher, close, settings, send, stop, suggestion, detail. */
  readonly Button: (props: TableAssistantButtonProps<TNode>) => TNode;
  /** The composer input. */
  readonly Composer: (
    props: TableAssistantComposerProps<TKeyboardEvent>
  ) => TNode;
  /** The connection badge. */
  readonly Badge: (props: TableAssistantBadgeProps) => TNode;
  /** The nonmodal floating surface. */
  readonly Window: (props: TableAssistantWindowProps<TNode, TStyle>) => TNode;
  /**
   * The examples menu in the composer.
   *
   * Optional, and the reason is the same as the chooser below: a kit that has
   * not filled it keeps the disclosure the chrome falls back to, rather than
   * losing the examples altogether. Every published kit fills it.
   */
  readonly Menu?: (props: TableAssistantMenuProps<TNode>) => TNode;
  /**
   * The language chooser beside the mic.
   *
   * Optional: a kit that has not filled it simply offers no chip, and a table
   * with one language never needed one. A kit that fills it draws its own
   * menu — this is a chooser, not a button with a list bolted on.
   */
  readonly LanguageChip?: (props: TableAssistantLanguageChipProps) => TNode;
}

/**
 * The language chooser shown when dictation offers more than one.
 *
 * Only ever drawn beside a mic that is already there. One language shows no
 * chip at all: asking a reader which language they are about to speak, when
 * there is only one answer, is slower than typing.
 *
 * @public
 */
export interface TableAssistantLanguageChipProps {
  /** Accessible name for the chooser itself. */
  readonly label: string;
  /** The tag in force. */
  readonly value: string;
  /** Every tag on offer, with the name to show for each. */
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly part: string;
  readonly className?: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
}

/**
 * Where the window may be placed.
 *
 * `"viewport"` fixes it to the screen. A ref scopes it to an application
 * container instead — a dashboard shell with its own chrome, say — so a host
 * does not have to reach into private CSS to move it.
 *
 * @public
 */
export type TableAssistantBoundary =
  "viewport" | { readonly current: HTMLElement | null };

/**
 * Which surface the conversation takes.
 *
 * - `floating` — a nonmodal window over the page, anchored bottom
 *   inline-end. The table keeps its full width and stays operable. Below the
 *   width where that stops being true it becomes the kit's own modal sheet.
 * - `panel` — an in-flow surface the host places itself.
 * - `sheet` — the kit's modal sheet at every width.
 *
 * @public
 */
export type TableAssistantPresentation = "panel" | "sheet" | "floating";

/**
 * Props for an adapter `TableAssistant` — no slots on the public API.
 *
 * @typeParam TNode - The binding's render node (a React node in React).
 *
 * @public
 */
export interface TableAssistantProps<TNode = unknown> {
  /**
   * Writing direction for surfaces this chrome draws through a portal.
   *
   * The panel and the launcher inherit direction from wherever the host put
   * them; the narrow-viewport sheet does not, because every kit portals it to
   * the document root. A right-to-left table passes `"rtl"` here so the sheet
   * is laid out the way the table it belongs to is.
   */
  readonly dir?: "ltr" | "rtl";
  /** The live conversation. */
  readonly assistant: TableAssistantView;
  /**
   * Dictation, when the host turned it on.
   *
   * Built by `useSpeechInput` and passed through, so the chrome draws a mic
   * without knowing anything about recognizers or recorders — and draws none
   * at all when this browser cannot listen.
   */
  readonly speech?: SpeechInputHandle;
  /** Whether the panel is showing. */
  readonly open: boolean;
  /** Asked to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /**
   * Nonmodal panel beside the table, or a modal sheet over it.
   *
   * A host that knows its own layout sets this; the default is a panel,
   * because a modal that was not asked for is worse than a narrow one.
   */
  readonly presentation?: TableAssistantPresentation;
  /** Labels; falls back to the built-in English. */
  readonly labels?: TableLabels;
  /**
   * The colour the conversation is drawn in.
   *
   * Any CSS colour, usually one of the kit's own tokens — each adapter passes
   * its primary. Everything mixes against it rather than using it flat, so a
   * strong brand colour tints the surfaces without shouting. Without one the
   * panel borrows the text colour, which is legible everywhere and belongs to
   * no brand.
   */
  readonly accent?: string;
  /**
   * Whether each action draws a card under the reply.
   *
   * On by default, and the reason is that a receipt is the only thing in the
   * conversation the reader can trust: the words above it are the model's,
   * and the card is read from what the table actually did. A host that has
   * its own account of a turn — an audit trail, a toast, a status line —
   * turns them off here rather than being given two.
   *
   * Turning them off hides the cards, not the record: the receipts stay in
   * the conversation state for a host that reads them.
   */
  readonly receipts?: boolean;
  /** Class for the surface. */
  readonly className?: string;
  /** Hide the floating launcher when the host supplies its own trigger. */
  readonly launcher?: boolean;
  /** Opens the host's own settings. Omit and no settings control is drawn. */
  readonly onSettings?: () => void;
  /**
   * Where a floating window is placed: the viewport, or a container of the
   * host's own. Ignored by the other presentations.
   */
  readonly boundary?: TableAssistantBoundary;
  /**
   * One sentence under the empty conversation's heading, for what the host
   * alone knows — that the examples are scripted until a backend is
   * connected, say.
   */
  readonly note?: string;
  /**
   * The assistant's opening line, before anyone has typed.
   *
   * Omit it and the panel opens with the built-in question. Pass your own to
   * say what this assistant is for — it is the first thing a reader reads,
   * and a table's own words beat a generic one. Pass an empty string and the
   * panel opens silent: an empty conversation with nothing standing in for a
   * message nobody wrote.
   */
  readonly greeting?: string;
  /**
   * The marks beside what each speaker said.
   *
   * A photograph, initials, the kit's own Avatar — anything the binding can
   * render. The panel draws the circle and the size, so a host supplies the
   * face and nothing else, and either side left out keeps its glyph.
   */
  readonly avatars?: TableAssistantAvatars<TNode>;
  /**
   * An offer to put at the end of one reply.
   *
   * The panel knows a message arrived; only the host knows whether it was an
   * answer or a wall. A scripted demo that cannot understand a question can
   * hand back the way past it — "connect a backend" — instead of leaving the
   * reader to find it. Return nothing for messages that need no offer.
   */
  readonly messageAction?: (
    message: TableAssistantMessageView
  ) => { readonly label: string; readonly onRun: () => void } | undefined;
  /**
   * A write waiting on the reader.
   *
   * The panel reviews it here when the approval's presentation names the
   * widget — which is the default, because the conversation is where the
   * write was asked for. Any other presentation reviews it elsewhere and the
   * panel only says so, rather than growing a second set of controls for one
   * decision.
   */
  readonly approval?: AgentApprovalPending | null;
}
