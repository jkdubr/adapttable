/**
 * Applies an attribute record from `@adapttable/core`'s prop getters to the
 * element it sits on, so a template writes `[adaptAttrs]="table.tableAttrs()"`
 * instead of binding each attribute by hand.
 */
import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
} from "@angular/core";

import { primitiveText } from "./columnDef";

/**
 * An attribute record: attribute values, an optional `style` object, event
 * handlers (`onClick`, `onChange`, `onKeyDown`, `onFocus` and the mouse
 * presses) and an optional `ref` that receives the element.
 *
 * @public
 */
export type Attrs = Readonly<Record<string, unknown>>;

/** The DOM event each handler key listens to. */
const EVENTS: Readonly<Record<string, string>> = {
  onClick: "click",
  // A prop getter's `onChange` follows every keystroke.
  onChange: "input",
  onKeyDown: "keydown",
  onFocus: "focus",
  onMouseDown: "mousedown",
  onMouseEnter: "mouseenter",
  onMouseUp: "mouseup",
};

/**
 * Boolean keys set as DOM properties rather than attributes, so a checkbox
 * follows the record after the user has clicked it.
 */
const PROPERTIES = new Set(["checked", "indeterminate"]);

/** Record keys spelled the React way, and the attribute each one names. */
const ATTRIBUTE_NAMES: Readonly<Record<string, string>> = {
  tabIndex: "tabindex",
};

/** The attribute text for a value, or `null` to remove the attribute. */
function attributeText(name: string, value: unknown): string | null {
  // ARIA states are tokens: `aria-selected="false"` says something.
  if (typeof value === "boolean" && !name.startsWith("aria-")) {
    return value ? "" : null;
  }
  return primitiveText(value);
}

/**
 * Apply an attribute record to the host element and keep it in step: a key
 * that leaves the record is removed, a style that leaves it is cleared, and
 * a handler is replaced when the record's changes.
 *
 * `value` is set as the property, so an input's text follows the record.
 *
 * @public
 */
@Directive({ selector: "[adaptAttrs]" })
export class AdaptAttrs {
  /** The attributes to apply. */
  readonly adaptAttrs = input.required<Attrs>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private attributes = new Set<string>();
  private styles = new Set<string>();
  private readonly handlers = new Map<string, (event: Event) => void>();
  private readonly listening = new Map<string, () => void>();
  private ref: ((element: HTMLElement | null) => void) | undefined;

  constructor() {
    effect(() => {
      this.apply(this.adaptAttrs());
    });
    inject(DestroyRef).onDestroy(() => {
      this.ref?.(null);
    });
  }

  private apply(attrs: Attrs): void {
    const attributes = new Set<string>();
    let styles = new Set<string>();
    for (const [name, value] of Object.entries(attrs)) {
      const event = EVENTS[name];
      if (event) this.handle(name, event, value);
      else if (name === "style") styles = this.applyStyle(value);
      else if (name === "ref") this.attachRef(value);
      else if (name === "value") this.setProperty(name, value ?? "");
      else if (PROPERTIES.has(name)) this.setProperty(name, value === true);
      else {
        const attribute = ATTRIBUTE_NAMES[name] ?? name;
        if (this.applyAttribute(attribute, value)) attributes.add(attribute);
      }
    }
    if (!("ref" in attrs)) this.attachRef(undefined);
    this.prune(attrs, attributes, styles);
  }

  /** Hand the element to a record's `ref`, and release the one it replaced. */
  private attachRef(value: unknown): void {
    const ref =
      typeof value === "function"
        ? (value as (element: HTMLElement | null) => void)
        : undefined;
    if (ref === this.ref) return;
    this.ref?.(null);
    this.ref = ref;
    ref?.(this.element.nativeElement);
  }

  private setProperty(name: string, value: unknown): void {
    this.renderer.setProperty(this.element.nativeElement, name, value);
  }

  /** Set one attribute; `false` when the value removes it. */
  private applyAttribute(name: string, value: unknown): boolean {
    const text = attributeText(name, value);
    if (text === null) return false;
    this.renderer.setAttribute(this.element.nativeElement, name, text);
    return true;
  }

  /** Set a style object's properties; returns the ones it set. */
  private applyStyle(style: unknown): Set<string> {
    const set = new Set<string>();
    const entries = Object.entries((style ?? {}) as Record<string, unknown>);
    for (const [property, value] of entries) {
      if (value === undefined || value === null) continue;
      set.add(property);
      this.renderer.setStyle(this.element.nativeElement, property, value);
    }
    return set;
  }

  /** Remove what the previous record set and this one does not. */
  private prune(
    attrs: Attrs,
    attributes: Set<string>,
    styles: Set<string>
  ): void {
    const host = this.element.nativeElement;
    for (const name of this.attributes) {
      if (!attributes.has(name)) this.renderer.removeAttribute(host, name);
    }
    for (const property of this.styles) {
      if (!styles.has(property)) this.renderer.removeStyle(host, property);
    }
    for (const name of this.handlers.keys()) {
      if (!(name in attrs)) this.handlers.delete(name);
    }
    this.attributes = attributes;
    this.styles = styles;
  }

  private handle(name: string, eventName: string, value: unknown): void {
    if (typeof value !== "function") {
      this.handlers.delete(name);
      return;
    }
    this.handlers.set(name, value as (event: Event) => void);
    if (this.listening.has(name)) return;
    this.listening.set(
      name,
      this.renderer.listen(this.element.nativeElement, eventName, (event) => {
        this.handlers.get(name)?.(event as Event);
      })
    );
  }
}
