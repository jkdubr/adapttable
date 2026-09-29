/**
 * In-place cell editing for Angular: core's one-active-cell session, as a
 * signal, plus the `editing()` feature that arms it.
 */
import {
  type CellEditingState,
  cellEditingView,
  createCellEditSession,
  type EditEventHandler,
} from "@adapttable/core";
import { coreEditing } from "@adapttable/core/binding";
import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  Injector,
  type Signal,
} from "@angular/core";

import type { AdaptTableFeature } from "./features";
import { fromStore } from "./store";

/**
 * A cell-edit write the host applies.
 *
 * @public
 */
export type CellEditHandler<TRow> = (
  row: TRow,
  columnKey: string,
  value: unknown
) => void | Promise<void>;

/**
 * Lifecycle observers for {@link injectCellEditing}.
 *
 * @public
 */
export interface CellEditingOptions<TRow = unknown> {
  /** An editor opened. */
  readonly onEditStart?: EditEventHandler<TRow>;
  /** The reader threw the draft away (Escape, or switching cells). */
  readonly onEditCancel?: EditEventHandler<TRow>;
  /** The injector to run in. Omit to use the current injection context. */
  readonly injector?: Injector;
}

/**
 * An editing feature that also carries the host's write.
 */
interface EditingFeature<TRow> extends AdaptTableFeature {
  readonly onCellEdit: CellEditHandler<TRow>;
}

/**
 * Edit a single cell in place.
 *
 * ```ts
 * import { editing } from "@adapttable/angular-unstyled";
 *
 * features: [editing((row, key, value) => save(row, key, value))]
 * ```
 *
 * @param onCellEdit - The host's write for a committed edit.
 * @param extras - Optional lifecycle observers merged into the feature patch.
 * @returns The feature.
 *
 * @public
 */
export function editing<TRow>(
  onCellEdit: CellEditHandler<TRow>,
  extras: Record<string, unknown> = {}
): AdaptTableFeature {
  return {
    ...coreEditing(onCellEdit, extras),
    onCellEdit,
  } as EditingFeature<TRow>;
}

/**
 * Headless editing state machine: one active cell, draft value, and the
 * Enter / Escape / Tab keyboard flow.
 *
 * @param options - Optional start/cancel observers.
 * @returns The state machine as a signal.
 *
 * @public
 */
export function injectCellEditing<TRow = unknown>(
  options: CellEditingOptions<TRow> = {}
): Signal<CellEditingState> {
  if (!options.injector) assertInInjectionContext(injectCellEditing);
  const injector = options.injector ?? inject(Injector);
  const session = createCellEditSession<TRow>({
    onEditStart: options.onEditStart,
    onEditCancel: options.onEditCancel,
  });
  effect(
    () => {
      session.configure({
        onEditStart: options.onEditStart,
        onEditCancel: options.onEditCancel,
      });
    },
    { injector }
  );
  const snapshot = fromStore(session, { injector });
  return computed(() => cellEditingView(session, snapshot()));
}
