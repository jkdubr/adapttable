/**
 * The Escape-close rule: an open overlay closes on Escape from wherever focus
 * is, unless a control inside it that is still showing owns the key.
 *
 * Kits disagree about Escape — some close only once focus is inside the
 * dropdown, some close too eagerly and dismiss a whole menu when an inner
 * editor was the one answering. A binding listens in the capture phase, ahead
 * of every kit, and asks this rule, so one rule covers every kit. Because the
 * capture phase runs first, an inner control cannot stop it with a
 * bubble-phase `stopPropagation`; controls that own Escape are named by a
 * selector instead.
 */

/**
 * Whether an element is on screen, without needing layout.
 *
 * Deliberately not `getClientRects()`: that answers "no" for everything in an
 * environment with no layout engine. Ancestors count: a kit hides its editor
 * by hiding the surface AROUND it, so asking the element alone answers
 * "visible" for something nobody can see.
 *
 * @param element - The element.
 * @returns Whether it is connected and neither it nor an ancestor is
 *   `display: none` or `visibility: hidden`.
 *
 * @public
 */
export function isElementShowing(element: Element): boolean {
  if (!element.isConnected) return false;
  let node: Element | null = element;
  while (node) {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    node = node.parentElement;
  }
  return true;
}

/**
 * Whether an Escape key event should close the overlay.
 *
 * A control only owns Escape while it is actually showing. A kit that keeps
 * its editor mounted after closing it would otherwise go on swallowing the
 * key, and the overlay around it would never close.
 *
 * @param event - The key and where it went down.
 * @param ignoreWithin - CSS selector for controls that answer Escape
 *   themselves.
 * @returns Whether to close.
 *
 * @public
 */
export function shouldEscapeClose(
  event: { readonly key: string; readonly target: unknown },
  ignoreWithin?: string
): boolean {
  if (event.key !== "Escape") return false;
  const target = event.target;
  if (
    !ignoreWithin ||
    typeof Element === "undefined" ||
    !(target instanceof Element)
  ) {
    return true;
  }
  const inner = target.closest(ignoreWithin);
  return !(inner && isElementShowing(inner));
}
