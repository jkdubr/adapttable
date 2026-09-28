/**
 * The table's glyphs as data.
 *
 * A glyph is content handed to a kit's own control, not a control: the kit
 * still renders the element the reader clicks. Declaring each one as shapes
 * rather than as a component is what lets every binding draw the same funnel,
 * chevron or avatar with its own renderer — a React element in React, a
 * template in Angular — without a per-binding copy of the path data.
 *
 * Property names follow the SVG attributes in camel case (`strokeWidth` is
 * `stroke-width`), which is how a JavaScript renderer spells them.
 */
import type { Direction } from "../types";

/**
 * One shape inside a glyph.
 *
 * @public
 */
export type IconShape =
  | {
      /** An SVG `<path>`. */
      readonly tag: "path";
      /** The path data. */
      readonly d: string;
      /** Fill override for this shape. */
      readonly fill?: string;
      /** Stroke for a path drawn inside an unstroked glyph. */
      readonly stroke?: string;
      /** The path's `stroke-width`. */
      readonly strokeWidth?: number | string;
      /** The path's `stroke-linecap`. */
      readonly strokeLinecap?: "round";
      /** The path's `stroke-linejoin`. */
      readonly strokeLinejoin?: "round";
    }
  | {
      /** An SVG `<circle>`. */
      readonly tag: "circle";
      /** Centre x. */
      readonly cx: number | string;
      /** Centre y. */
      readonly cy: number | string;
      /** Radius. */
      readonly r: number | string;
      /** Fill override for this shape. */
      readonly fill?: string;
    }
  | {
      /** An SVG `<rect>`. */
      readonly tag: "rect";
      /** Left edge. */
      readonly x: number | string;
      /** Top edge. */
      readonly y: number | string;
      /** Width. */
      readonly width: number | string;
      /** Height. */
      readonly height: number | string;
      /** Corner radius. */
      readonly rx?: number | string;
      /** Fill override for this shape. */
      readonly fill?: string;
    };

/**
 * One glyph: the `<svg>` element's attributes and the shapes inside it.
 *
 * Every glyph is decorative (`aria-hidden="true"`); the control it sits in
 * carries the accessible name.
 *
 * @public
 */
export interface IconDescriptor {
  /** The `viewBox` attribute. */
  readonly viewBox: string;
  /** The `width` attribute. */
  readonly width: number | string;
  /** The `height` attribute. */
  readonly height: number | string;
  /** The `fill` attribute. */
  readonly fill?: string;
  /** The `stroke` attribute. */
  readonly stroke?: string;
  /** The `stroke-width` attribute. */
  readonly strokeWidth?: number | string;
  /** The `stroke-linecap` attribute. */
  readonly strokeLinecap?: "round";
  /** The `stroke-linejoin` attribute. */
  readonly strokeLinejoin?: "round";
  /** `"false"` keeps old Edge from tabbing into the glyph. */
  readonly focusable?: "false";
  /** Inline style for a glyph that turns or animates. */
  readonly style?: {
    readonly transform?: string;
    readonly transition?: string;
  };
  /** The shapes, in paint order. */
  readonly shapes: readonly IconShape[];
}

/** A toolbar glyph: a 2px round stroke on a 24-grid, at a fixed size. */
/* @__NO_SIDE_EFFECTS__ */
function toolbarGlyph(
  size: number,
  shapes: readonly IconShape[]
): IconDescriptor {
  return {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    focusable: "false",
    shapes,
  };
}

/**
 * Three-line funnel for the Filters button.
 *
 * @public
 */
export const FILTERS_ICON: IconDescriptor = toolbarGlyph(16, [
  { tag: "path", d: "M4 6h16M7 12h10M10 18h4" },
]);

/**
 * Magnifier for the search field.
 *
 * @public
 */
export const SEARCH_ICON: IconDescriptor = toolbarGlyph(14, [
  { tag: "circle", cx: 11, cy: 11, r: 7 },
  { tag: "path", d: "M21 21l-4.35-4.35" },
]);

/**
 * Inline expand chevron: points into the row (flipped for RTL) and turns to
 * point down while the detail panel is open, so every kit's desktop row and
 * mobile card show the same affordance.
 *
 * @param state - Whether the panel is open, and the writing direction.
 * @returns The chevron for that state.
 *
 * @public
 */
export function expandChevronIcon(state: {
  readonly open: boolean;
  readonly dir?: Direction;
}): IconDescriptor {
  let transform: string | undefined;
  if (state.open) transform = "rotate(90deg)";
  else if (state.dir === "rtl") transform = "rotate(180deg)";
  return {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    focusable: "false",
    style: { transform, transition: "transform 0.2s ease" },
    shapes: [
      {
        tag: "path",
        d: "m9 6 6 6-6 6",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
    ],
  };
}

/**
 * Six-dot drag grip for the column menu.
 *
 * @public
 */
export const GRIP_ICON: IconDescriptor = {
  viewBox: "0 0 24 24",
  width: "14",
  height: "14",
  fill: "currentColor",
  shapes: [
    { tag: "circle", cx: "9", cy: "6", r: "1.6" },
    { tag: "circle", cx: "15", cy: "6", r: "1.6" },
    { tag: "circle", cx: "9", cy: "12", r: "1.6" },
    { tag: "circle", cx: "15", cy: "12", r: "1.6" },
    { tag: "circle", cx: "9", cy: "18", r: "1.6" },
    { tag: "circle", cx: "15", cy: "18", r: "1.6" },
  ],
};

/** A column-menu glyph: a 1.8px round stroke on a 24-grid. */
/* @__NO_SIDE_EFFECTS__ */
function menuGlyph(size: string, shapes: readonly IconShape[]): IconDescriptor {
  return {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    shapes,
  };
}

/**
 * Eye for a visible column, or an eye with a slash for a hidden one.
 *
 * @param off - Whether the column is hidden.
 * @returns The glyph for that state.
 *
 * @public
 */
export function eyeIcon(off = false): IconDescriptor {
  const shapes: IconShape[] = [
    { tag: "path", d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" },
    { tag: "circle", cx: "12", cy: "12", r: "3" },
  ];
  if (off) shapes.push({ tag: "path", d: "M3 3l18 18" });
  return menuGlyph("16", shapes);
}

/**
 * Pin for the column menu.
 *
 * @public
 */
export const PIN_ICON: IconDescriptor = menuGlyph("15", [
  { tag: "path", d: "M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6Z" },
  { tag: "path", d: "M12 15v5" },
]);

/** The generic operation bolt, for an action whose kind has no glyph. */
const OPERATION_PATH = "M13 2 4 14h7l-1 8 9-12h-7l1-8Z";

/** The generic operation's hue. */
const OPERATION_HUE = 260;

/** Stroke settings the assistant's glyphs share. */
const ASSISTANT_STROKE = {
  viewBox: "0 0 24 24",
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  focusable: "false",
} as const;

/** An avatar: filled shapes sized to their circle. */
/* @__NO_SIDE_EFFECTS__ */
function avatarGlyph(shapes: readonly IconShape[]): IconDescriptor {
  return {
    viewBox: "0 0 40 40",
    width: "100%",
    height: "100%",
    fill: "currentColor",
    focusable: "false",
    shapes,
  };
}

/** The avatar's features, punched out of the head in the ground colour. */
const AVATAR_EYE = "var(--adapttable-assistant-eye, #fff)";

/**
 * The assistant's face, for a host that has not supplied one.
 *
 * An avatar, not an icon: filled shapes that fill their circle, because a
 * hairline glyph floating in the middle of one reads as a button that lost
 * its label. It is drawn in the current colour, so the circle around it — and
 * so the kit's own accent — carries it without naming a second colour. The
 * aerial makes a rounded square read as a head rather than a card; the eyes
 * are the ground showing through, so they cannot fight the fill for contrast;
 * the ears stop the head floating free of the circle's edge.
 *
 * @public
 */
export const ASSISTANT_AVATAR_ICON: IconDescriptor = avatarGlyph([
  { tag: "circle", cx: "20", cy: "8.5", r: "2.6" },
  { tag: "rect", x: "19", y: "10.5", width: "2", height: "3.5", rx: "1" },
  { tag: "rect", x: "9", y: "13.5", width: "22", height: "17", rx: "6" },
  { tag: "circle", cx: "15.6", cy: "21", r: "2.2", fill: AVATAR_EYE },
  { tag: "circle", cx: "24.4", cy: "21", r: "2.2", fill: AVATAR_EYE },
  {
    tag: "rect",
    x: "16.5",
    y: "25.4",
    width: "7",
    height: "1.8",
    rx: "0.9",
    fill: AVATAR_EYE,
  },
  { tag: "rect", x: "5.5", y: "18.5", width: "2.6", height: "7", rx: "1.3" },
  { tag: "rect", x: "31.9", y: "18.5", width: "2.6", height: "7", rx: "1.3" },
]);

/**
 * The reader's face, for a host that has not supplied one.
 *
 * A silhouette rather than a photograph or initials: the panel does not know
 * who is reading, and inventing a face or a letter for them would be a guess
 * printed beside everything they say. The shoulders run off the bottom of the
 * circle, which is what makes it read as a person rather than a lollipop.
 *
 * @public
 */
export const PERSON_AVATAR_ICON: IconDescriptor = avatarGlyph([
  { tag: "circle", cx: "20", cy: "15", r: "6.8" },
  {
    tag: "path",
    d: "M20 24.2c-6.6 0-12 4.6-12 10.3V40h24v-5.5c0-5.7-5.4-10.3-12-10.3Z",
  },
]);

/** An assistant glyph drawn from stroked shapes. */
/* @__NO_SIDE_EFFECTS__ */
function assistantGlyph(shapes: readonly IconShape[]): IconDescriptor {
  return { ...ASSISTANT_STROKE, shapes };
}

/**
 * The assistant's settings cog.
 *
 * @public
 */
export const ASSISTANT_SETTINGS_ICON: IconDescriptor = assistantGlyph([
  { tag: "circle", cx: "12", cy: "12", r: "3" },
  {
    tag: "path",
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z",
  },
]);

/**
 * The assistant's close cross.
 *
 * @public
 */
export const ASSISTANT_CLOSE_ICON: IconDescriptor = assistantGlyph([
  { tag: "path", d: "M18 6 6 18M6 6l12 12" },
]);

/**
 * The composer's send arrow.
 *
 * @public
 */
export const ASSISTANT_SEND_ICON: IconDescriptor = assistantGlyph([
  { tag: "path", d: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" },
]);

/**
 * Stop a turn in flight.
 *
 * @public
 */
export const ASSISTANT_STOP_ICON: IconDescriptor = assistantGlyph([
  {
    tag: "rect",
    x: "7",
    y: "7",
    width: "10",
    height: "10",
    rx: "1.5",
    fill: "currentColor",
  },
]);

/**
 * One glyph per kind of thing the assistant does.
 *
 * A row reading "Filter applied · Status is Active" is a sentence to parse;
 * a funnel beside it is recognised before it is read, which is what lets a
 * reader scan four actions instead of reading them. Every kind a receipt can
 * carry is here — a kind with no glyph would put an unexplained gap in the
 * column the others line up in.
 *
 * These are strokes on a 24-grid, drawn in the current colour at the size the
 * text around them sets, so a kit's own palette and control size carry them.
 *
 * @public
 */
export const ASSISTANT_KIND_PATHS: Readonly<Record<string, string>> = {
  // A funnel: what a filter does to a table, in one shape.
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3Z",
  // Two arrows facing opposite ways, which is the direction question a sort
  // answers — not a list, which is what every other kind here already is.
  sort: "M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4",
  group: "M3 5h8v6H3zM13 5h8v6h-8zM3 13h8v6H3zM13 13h8v6h-8z",
  // Going one way or the other through something longer than the screen.
  page: "M10 6l-4 6 4 6M16 6l4 6-4 6",
  // A sigma: the symbol the reader already associates with a total.
  aggregate: "M18 4H6l7 8-7 8h12",
  select:
    "M21 11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9M9 12l3 3 9-9",
  pin: "M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z",
  hide: "M3 3l18 18M10.6 10.6A3 3 0 0 0 13.4 13.4M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.2 4.3M6.1 6.1A16 16 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9",
  order: "M7 6h14M7 12h10M7 18h14M3 8l2-2 2 2M3 16l2 2 2-2",
  // The same pin, held against the rows it holds in place.
  pinRow:
    "M13 14v4M10.5 4h5l-.8 5 2.3 2.3V14h-8v-2.7L11.3 9l-.8-5ZM3 8h4M3 12h4M3 16h4",
  read: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  export: "M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z",
  add: "M12 5v14M5 12h14",
  delete:
    "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6",
  reorder: "M9 6h12M9 12h12M9 18h12M3 8l2-2 2 2M3 16l2 2 2-2",
  // The host's own capability: a spark, because nothing here knows what it
  // does and a shape that guessed would be wrong for most of them.
  operation: OPERATION_PATH,
};

/**
 * The microphone, with a dot while it is listening.
 *
 * @param listening - Whether voice input is on.
 * @returns The glyph for that state.
 *
 * @public
 */
export function assistantMicIcon(listening = false): IconDescriptor {
  const shapes: IconShape[] = [
    { tag: "rect", x: "9", y: "2", width: "6", height: "12", rx: "3" },
    { tag: "path", d: "M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" },
  ];
  if (listening) {
    shapes.push({
      tag: "circle",
      cx: "12",
      cy: "8",
      r: "1.5",
      fill: "currentColor",
    });
  }
  return assistantGlyph(shapes);
}

/**
 * The glyph for one kind of assistant action, or `undefined` for a kind with
 * none.
 *
 * @param kind - The action's kind, from its presentation metadata.
 * @returns The glyph, or `undefined`.
 *
 * @public
 */
export function assistantKindIcon(
  kind: string | undefined
): IconDescriptor | undefined {
  const d = kind ? ASSISTANT_KIND_PATHS[kind] : undefined;
  return d === undefined ? undefined : assistantGlyph([{ tag: "path", d }]);
}

/**
 * The examples trigger: a lightbulb, for the prompts a reader can start from.
 *
 * @public
 */
export const ASSISTANT_EXAMPLES_ICON: IconDescriptor = assistantGlyph([
  {
    tag: "path",
    d: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z",
  },
]);

/**
 * Put this back: an arrow turning left into a hook.
 *
 * Drawn as two strokes — a head and the path it came from — because a single
 * near-closed arc renders as a plain circle at the size a row gives it, which
 * tells a reader nothing about what the control does.
 *
 * @public
 */
export const ASSISTANT_UNDO_ICON: IconDescriptor = assistantGlyph([
  { tag: "path", d: "M9 14 4 9l5-5" },
  { tag: "path", d: "M4 9h7a6 6 0 0 1 6 6v3" },
]);

/**
 * What a turn did, for the control that reveals the list: the generic
 * operation bolt.
 *
 * @public
 */
export const ASSISTANT_ACTIONS_ICON: IconDescriptor = assistantGlyph([
  { tag: "path", d: OPERATION_PATH },
]);

/**
 * A hue per kind, so a list of actions is told apart before it is read.
 *
 * One accent for every tile makes a column of identically coloured squares,
 * which carries no more than no colour at all. These are angles rather than
 * colours: lightness and chroma are fixed below, so every tile is the same
 * weight on the page and the same contrast in light and in dark.
 *
 * @public
 */
export const ASSISTANT_KIND_HUES: Readonly<Record<string, number>> = {
  filter: 295,
  sort: 150,
  search: 230,
  group: 45,
  page: 250,
  aggregate: 330,
  select: 195,
  pin: 20,
  hide: 280,
  order: 95,
  pinRow: 20,
  read: 215,
  export: 175,
  edit: 270,
  add: 140,
  delete: 25,
  reorder: 95,
  operation: OPERATION_HUE,
};

/**
 * A receipt tile's glyph and ink: the kind's own glyph in its own hue, and
 * the generic operation for a kind with none, so the column does not break
 * where a host capability sits.
 *
 * @param kind - The action's kind, from its presentation metadata.
 * @returns The glyph at tile size, and the ink colour the tile paints with.
 *
 * @public
 */
export function assistantReceiptIcon(kind: string | undefined): {
  readonly icon: IconDescriptor;
  readonly ink: string;
} {
  const hue = (kind ? ASSISTANT_KIND_HUES[kind] : undefined) ?? OPERATION_HUE;
  const d = (kind ? ASSISTANT_KIND_PATHS[kind] : undefined) ?? OPERATION_PATH;
  return {
    icon: {
      ...ASSISTANT_STROKE,
      width: "1.3em",
      height: "1.3em",
      shapes: [{ tag: "path", d }],
    },
    // Mid lightness and moderate chroma: legible on a white card and on a
    // dark one, without a second colour per theme.
    ink: `oklch(0.58 0.17 ${String(hue)})`,
  };
}
