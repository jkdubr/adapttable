/**
 * The controls a kit must supply for the assistant panel.
 *
 * Core draws no button, no input and no surface: every visible control here
 * is a required slot, so a Mantine table's assistant is made of Mantine
 * components and an antd table's is made of antd ones. The chrome owns
 * structure, keyboard behaviour, part names and announcements — nothing a
 * reader can click.
 *
 * The shapes live in `@adapttable/core`; this module binds them to React's
 * node, key event and inline style.
 */
import type {
  TableAssistantAvatars as NeutralTableAssistantAvatars,
  TableAssistantButtonProps as NeutralTableAssistantButtonProps,
  TableAssistantComposerProps as NeutralTableAssistantComposerProps,
  TableAssistantFace as NeutralTableAssistantFace,
  TableAssistantMenuItem as NeutralTableAssistantMenuItem,
  TableAssistantMenuProps as NeutralTableAssistantMenuProps,
  TableAssistantPanelProps as NeutralTableAssistantPanelProps,
  TableAssistantSheetProps as NeutralTableAssistantSheetProps,
  TableAssistantSlots as NeutralTableAssistantSlots,
  TableAssistantWindowProps as NeutralTableAssistantWindowProps,
} from "@adapttable/core/binding";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

export type {
  TableAssistantBadgeProps,
  TableAssistantLanguageChipProps,
} from "@adapttable/core/binding";

/**
 * One speaker's mark — `@adapttable/core`'s `TableAssistantFace` with
 * React's node.
 *
 * @public
 */
export type TableAssistantFace = NeutralTableAssistantFace<ReactNode>;

/**
 * The marks beside what each speaker said — `@adapttable/core`'s
 * `TableAssistantAvatars` with React's node.
 *
 * @public
 */
export type TableAssistantAvatars = NeutralTableAssistantAvatars<ReactNode>;

/**
 * A kit button — `@adapttable/core`'s `TableAssistantButtonProps` with
 * React's node.
 *
 * @public
 */
export type TableAssistantButtonProps =
  NeutralTableAssistantButtonProps<ReactNode>;

/**
 * The floating conversation window — `@adapttable/core`'s
 * `TableAssistantWindowProps` with React's node and inline style.
 *
 * @public
 */
export type TableAssistantWindowProps = NeutralTableAssistantWindowProps<
  ReactNode,
  CSSProperties
>;

/**
 * The kit's own multiline input — `@adapttable/core`'s
 * `TableAssistantComposerProps` with React's key event.
 *
 * @public
 */
export type TableAssistantComposerProps = NeutralTableAssistantComposerProps<
  KeyboardEvent<HTMLElement>
>;

/**
 * The desktop surface that sits beside the table — `@adapttable/core`'s
 * `TableAssistantPanelProps` with React's node.
 *
 * @public
 */
export type TableAssistantPanelProps =
  NeutralTableAssistantPanelProps<ReactNode>;

/**
 * The modal surface a narrow viewport gets instead — `@adapttable/core`'s
 * `TableAssistantSheetProps` with React's node.
 *
 * @public
 */
export type TableAssistantSheetProps =
  NeutralTableAssistantSheetProps<ReactNode>;

/**
 * One entry in the examples menu — `@adapttable/core`'s
 * `TableAssistantMenuItem` with React's node.
 *
 * @public
 */
export type TableAssistantMenuItem = NeutralTableAssistantMenuItem<ReactNode>;

/**
 * A menu hung off one trigger — `@adapttable/core`'s
 * `TableAssistantMenuProps` with React's node.
 *
 * @public
 */
export type TableAssistantMenuProps = NeutralTableAssistantMenuProps<ReactNode>;

/**
 * Every control {@link TableAssistantChrome} needs from a kit —
 * `@adapttable/core`'s `TableAssistantSlots` drawing React nodes.
 *
 * @public
 */
export type TableAssistantSlots = NeutralTableAssistantSlots<
  ReactNode,
  KeyboardEvent<HTMLElement>,
  CSSProperties
>;
