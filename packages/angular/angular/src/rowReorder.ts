/**
 * Row reordering for Angular: core's grab / drag / keyboard model, published
 * as a signal so the grip and drop targets stay in sync with the table.
 */
import {
  createRowReorderController,
  isRowMovePending,
  type RowDragEvent,
  type RowKeyEvent,
  type RowReorderHandler,
  type RowReorderOptions,
  rowReorderRowAttributes,
  rowReorderRuntimeOptions,
  type TableSource,
} from "@adapttable/core";
import { type RowReorderState as NeutralRowReorderState } from "@adapttable/core/binding";
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  type Signal,
} from "@angular/core";

import type { DataTable } from "./dataTable";
import type { AdaptTableFeature } from "./features";
import { tableRuntimeFor } from "./grouping";
import { fromStore } from "./store";

/**
 * Headless reorder state — core's contract with Angular's drag and key events.
 *
 * @public
 */
export type RowReorderState<TRow> = NeutralRowReorderState<
  TRow,
  DragEvent,
  KeyboardEvent
>;

/**
 * A row-reorder feature that also carries the host's write and options.
 */
interface RowReorderFeature<TRow> extends AdaptTableFeature {
  readonly onRowReorder: RowReorderHandler<TRow>;
  readonly options?: RowReorderOptions<TRow>;
}

/**
 * Let rows be dragged, or moved with the keyboard, into a new order.
 *
 * ```ts
 * import { rowReorder } from "@adapttable/angular-unstyled";
 *
 * features: [rowReorder((from, to) => reorder(from, to))]
 * ```
 *
 * The table never writes to your rows: the handler is told what moved where
 * and the new order is yours to apply.
 *
 * @param onRowReorder - The host's write for a reorder.
 * @param options - Move policy and cross-boundary handlers.
 * @returns The feature.
 *
 * @public
 */
export function rowReorder<TRow>(
  onRowReorder: RowReorderHandler<TRow>,
  options?: RowReorderOptions<TRow>
): AdaptTableFeature {
  return {
    id: "row-reorder",
    onRowReorder,
    options,
  } as RowReorderFeature<TRow>;
}

/**
 * Options for {@link injectRowReorder}.
 *
 * @public
 */
export interface RowReorderStateOptions<TRow> {
  /** The headless table. */
  readonly table: DataTable<TRow>;
  /** The live source the controller reads rows from. */
  readonly source: Signal<TableSource<TRow>>;
  /** The composed features; the reorder seeds from the one with id `row-reorder`. */
  readonly features: readonly AdaptTableFeature[];
  /** The injector to run effects in. */
  readonly injector?: Injector;
}

function rowReorderFeatureOf<TRow>(
  features: readonly AdaptTableFeature[]
): RowReorderFeature<TRow> | undefined {
  return features.find(
    (feature): feature is RowReorderFeature<TRow> =>
      feature.id === "row-reorder"
  );
}

function asDrag(event: DragEvent): RowDragEvent {
  return event as unknown as RowDragEvent;
}

function asKey(event: KeyboardEvent): RowKeyEvent {
  return event as unknown as RowKeyEvent;
}

/**
 * The live reorder state when {@link rowReorder} is composed. Absent
 * otherwise — the grip draws nothing.
 *
 * @param options - See {@link RowReorderStateOptions}.
 * @returns The state as a signal, or `undefined` when the feature is off.
 *
 * @public
 */
export function injectRowReorder<TRow>(
  options: RowReorderStateOptions<TRow>
): Signal<RowReorderState<TRow>> | undefined {
  const feature = rowReorderFeatureOf<TRow>(options.features);
  if (!feature) return undefined;
  if (!options.injector) assertInInjectionContext(injectRowReorder);
  const injector = options.injector ?? inject(Injector);
  const destroyRef = injector.get(DestroyRef);
  const runtime = tableRuntimeFor(
    options.table,
    options.source,
    options.features
  );
  const controllerOptions = () =>
    rowReorderRuntimeOptions(runtime, feature.onRowReorder, feature.options);
  const controller = createRowReorderController<TRow>(controllerOptions());
  effect(
    () => {
      controller.configure(controllerOptions());
    },
    { injector }
  );
  destroyRef.onDestroy(controller.connect());

  const snapshot = fromStore(controller, { injector });
  return computed((): RowReorderState<TRow> => {
    const {
      lifted,
      overIndex,
      overPosition,
      pendingMove,
      hostConfirmPending,
      announcement,
    } = snapshot();
    return {
      lifted,
      overIndex,
      overPosition,
      pendingMove,
      hostConfirmPending,
      announcement,
      isLifted: (rowId) => lifted?.rowId === rowId,
      isMovePending: (row) =>
        isRowMovePending(
          pendingMove,
          row,
          (entry) => runtime.view()?.getRowId(entry) ?? ""
        ),
      dragProps: (rowId, localIndex) => ({
        draggable: true,
        onDragStart: (event) => {
          controller.dragStart(asDrag(event), rowId, localIndex);
        },
        onDragEnd: () => {
          controller.dragEnd();
        },
      }),
      dropProps: (localIndex, row, windowStart) => ({
        onDragOver: (event) => {
          controller.dragOver(asDrag(event), localIndex);
        },
        onDrop: (event) => {
          controller.drop(asDrag(event), localIndex, row, windowStart);
        },
      }),
      handleKeyDown: (event, rowId, localIndex, row, windowStart, rowCount) => {
        controller.keyDown(asKey(event), {
          rowId,
          localIndex,
          row,
          windowStart,
          rowCount,
        });
      },
      moveBy: controller.moveBy,
      moveMenu: controller.moveMenu,
      selectMoveTarget: controller.selectMoveTarget,
      confirmMove: controller.confirmMove,
      cancelMove: controller.cancelMove,
      rowAttrs: (rowId, localIndex) =>
        rowReorderRowAttributes(
          { lifted, overIndex, overPosition },
          rowId,
          localIndex
        ),
    };
  });
}
