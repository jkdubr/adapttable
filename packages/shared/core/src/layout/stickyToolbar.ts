/**
 * The sticky toolbar rule: when the toolbar pins with the sticky header,
 * how it is parked, and how far the header has to sit below it.
 */

/**
 * Whether the toolbar should pin with the sticky header.
 *
 * Inside a table that already scrolls in a box (`maxHeight`, or a kit's
 * native virtual scroller) the toolbar sits *outside* that box — it stays
 * on screen without `position: sticky`. Pinning it to the page anyway
 * detaches search from the card while the rows still scroll inside, which
 * is the ugly double-scroller.
 *
 * @param stickyHeader - Whether the header is sticky.
 * @param stickyToolbar - The host's explicit choice, when it made one.
 * @param inScrollBox - Whether the table scrolls inside its own box.
 * @returns Whether to pin the toolbar.
 *
 * @public
 */
export function resolveStickyToolbar(
  stickyHeader?: boolean,
  stickyToolbar?: boolean,
  inScrollBox = false
): boolean {
  if (inScrollBox) return false;
  return stickyToolbar ?? Boolean(stickyHeader);
}

/**
 * The style that parks a sticky toolbar.
 *
 * @public
 */
export interface StickyToolbarStyle {
  /** Always `"sticky"`. */
  readonly position: "sticky";
  /** Offset from the top of the scroll container. */
  readonly top: number;
  /** Above the rows and the pinned cells. */
  readonly zIndex: number;
  /** Opaque, so rows do not show through. */
  readonly background: string;
}

/**
 * The style that parks the toolbar at `stickyTop`, or `undefined` when it is
 * not sticky.
 *
 * @param enabled - Whether the toolbar is sticky.
 * @param stickyTop - Offset from the top of the scroll container.
 * @returns The style.
 *
 * @public
 */
export function stickyToolbarStyle(
  enabled: boolean,
  stickyTop = 0
): StickyToolbarStyle | undefined {
  return enabled
    ? {
        position: "sticky",
        top: stickyTop,
        zIndex: 3,
        background: "var(--adapttable-surface, Canvas)",
      }
    : undefined;
}

/**
 * How far down the sticky header sits, so the header does not slide under a
 * sticky toolbar of the measured height.
 *
 * @param enabled - Whether the toolbar is sticky.
 * @param stickyTop - Offset from the top of the scroll container.
 * @param toolbarHeight - The toolbar's measured height.
 * @returns The header's top offset.
 *
 * @public
 */
export function stickyHeaderOffset(
  enabled: boolean,
  stickyTop: number,
  toolbarHeight: number
): number {
  return enabled ? stickyTop + toolbarHeight : stickyTop;
}

/**
 * An element's height rounded up to a whole pixel, as the sticky layout
 * measures the toolbar.
 *
 * @param element - The toolbar.
 * @returns The height.
 *
 * @public
 */
export function measuredToolbarHeight(
  element: Pick<Element, "getBoundingClientRect">
): number {
  return Math.ceil(element.getBoundingClientRect().height);
}
