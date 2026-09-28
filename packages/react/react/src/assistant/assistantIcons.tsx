/**
 * The assistant's glyphs.
 *
 * These are content handed to a kit's own button, not controls drawn in core:
 * the kit still renders the element the reader clicks. They inherit
 * `currentColor` and size in `em`, so each kit's text colour and control size
 * carry them without a per-kit copy. The shapes are `@adapttable/core`'s, so
 * every binding draws the same glyph.
 */
import {
  ASSISTANT_ACTIONS_ICON,
  ASSISTANT_AVATAR_ICON,
  ASSISTANT_CLOSE_ICON,
  ASSISTANT_EXAMPLES_ICON,
  ASSISTANT_SEND_ICON,
  ASSISTANT_SETTINGS_ICON,
  ASSISTANT_STOP_ICON,
  ASSISTANT_UNDO_ICON,
  assistantKindIcon,
  assistantMicIcon,
  assistantReceiptIcon,
  PERSON_AVATAR_ICON,
} from "@adapttable/core/binding";
import type { ReactElement } from "react";

import { IconSvg } from "../iconSvg";

/**
 * The assistant's face, for a host that has not supplied one.
 *
 * @internal
 */
export function AssistantAvatar(): ReactElement {
  return <IconSvg icon={ASSISTANT_AVATAR_ICON} />;
}

/**
 * The reader's face, for a host that has not supplied one.
 *
 * @internal
 */
export function PersonAvatar(): ReactElement {
  return <IconSvg icon={PERSON_AVATAR_ICON} />;
}

/** Settings. @internal */
export function SettingsIcon(): ReactElement {
  return <IconSvg icon={ASSISTANT_SETTINGS_ICON} />;
}

/** Close. @internal */
export function CloseIcon(): ReactElement {
  return <IconSvg icon={ASSISTANT_CLOSE_ICON} />;
}

/** Send. @internal */
export function SendIcon(): ReactElement {
  return <IconSvg icon={ASSISTANT_SEND_ICON} />;
}

/** Stop a turn in flight. @internal */
export function StopIcon(): ReactElement {
  return <IconSvg icon={ASSISTANT_STOP_ICON} />;
}

/**
 * The microphone, with a dot while it is listening.
 *
 * @internal
 */
export function MicIcon({
  listening,
}: {
  readonly listening?: boolean;
}): ReactElement {
  return <IconSvg icon={assistantMicIcon(listening)} />;
}

/**
 * A glyph for a suggested prompt, or nothing when the kind is unknown.
 *
 * @param kind - The prompt's kind, from its presentation metadata.
 * @internal
 */
export function SuggestionIcon({
  kind,
}: {
  readonly kind?: string;
}): ReactElement | null {
  const icon = assistantKindIcon(kind);
  return icon ? <IconSvg icon={icon} /> : null;
}

/**
 * The examples trigger: a lightbulb, for the prompts a reader can start from.
 *
 * @internal
 */
export function ExamplesIcon(): ReactElement {
  return <IconSvg icon={ASSISTANT_EXAMPLES_ICON} />;
}

/**
 * Put this back: an arrow turning left into a hook. The word travels beside
 * it, because the glyph alone is small at the size a row gives it.
 *
 * @internal
 */
export function UndoIcon(): ReactElement {
  return <IconSvg icon={ASSISTANT_UNDO_ICON} />;
}

/**
 * What a turn did: a short list, for the control that reveals one.
 *
 * @internal
 */
export function ActionsIcon(): ReactElement {
  return <IconSvg icon={ASSISTANT_ACTIONS_ICON} />;
}

/**
 * The glyph for one action, on a tile of its own.
 *
 * The tile is what makes a column of actions scannable: same size, same
 * place, one recognisable shape each, so four of them read as a list of
 * things rather than four lines of prose. It is tinted from the kit's accent
 * rather than given a colour here, so a Mantine table's actions are Mantine
 * blue and an antd table's are antd's — the same rule the rest of the panel
 * follows.
 *
 * @param kind - What the action was, from the receipt's subject.
 * @internal
 */
export function ReceiptIcon({
  kind,
}: {
  readonly kind?: string;
}): ReactElement {
  const { icon, ink } = assistantReceiptIcon(kind);
  return (
    <span
      aria-hidden="true"
      data-adapttable-part="assistant-receipt-icon"
      data-kind={kind}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        inlineSize: "2.3em",
        blockSize: "2.3em",
        flexShrink: 0,
        // Squircle rather than circle: a circle beside the round speaker mark
        // reads as a second speaker, and these are things the turn did.
        borderRadius: "0.7em",
        background: `color-mix(in oklab, ${ink} 16%, transparent)`,
        color: ink,
        fontSize: "0.95em",
      }}
    >
      {/* An unknown kind still gets its tile, so the column does not break
          where a host capability sits. */}
      <IconSvg icon={icon} />
    </span>
  );
}
