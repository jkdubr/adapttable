/**
 * The motion every AdaptTable binding shares.
 *
 * Timing is part of how the table feels, not of any one framework: a reader
 * who switches from a React kit to an Angular one should not get a different
 * feel for the same gesture. Each binding drives its own animation with these
 * numbers.
 */

/**
 * The motion every AdaptTable overlay shares.
 *
 * One pair of curves, used by the drawers in `@adapttable/unstyled` (and so
 * `@adapttable/shadcn`), `@adapttable/base-ui` and `@adapttable/radix`, so a
 * reader who switches kits does not get a different feel for the same gesture.
 * The kits with their own drawer primitive — Mantine, MUI, Chakra, Ant Design —
 * keep theirs.
 *
 * Arriving decelerates: the panel is new information and lands softly. Leaving
 * accelerates and takes less time, because a dismissal the reader already
 * decided on should not be waited on.
 *
 * @public
 */
export const OVERLAY_MOTION = {
  /** Milliseconds for an overlay to arrive. */
  enterMs: 340,
  /** Milliseconds for an overlay to leave. Shorter on purpose. */
  exitMs: 240,
  /** Deceleration curve for arriving — the side-sheet easing. */
  enterEasing: "cubic-bezier(0.32, 0.72, 0, 1)",
  /** Acceleration curve for leaving. */
  exitEasing: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/**
 * The entrance stagger rows and cards play when `animate` is on.
 *
 * Every kit marks its row and card elements with `data-stagger`; the binding
 * animates each marked element with these keyframes, one `stepMs` after the
 * one before it, and skips the whole thing under `prefers-reduced-motion`.
 *
 * @public
 */
export const MOUNT_STAGGER = {
  /** Selector for the elements that animate. */
  selector: "[data-stagger]",
  /** Per-item delay in ms. */
  stepMs: 40,
  /** Tween duration in ms. */
  durationMs: 320,
  /** Ease-out curve: items arrive quickly and settle. */
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** From a short rise below its place, faded out, to rest. */
  keyframes: [
    { opacity: 0, transform: "translateY(8px)" },
    { opacity: 1, transform: "translateY(0)" },
  ],
} as const;
