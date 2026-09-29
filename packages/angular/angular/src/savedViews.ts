/**
 * Named snapshots of the table's URL state — its search, sort, filters,
 * paging and layout — kept in storage, as signals over core's controller.
 */
import {
  createSavedViewsController,
  safeLocalStorage,
  type SavedView,
  type SavedViewsControllerOptions,
} from "@adapttable/core";
import type { UseSavedViewsResult } from "@adapttable/core/binding";
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  inject,
  Injector,
  type Signal,
} from "@angular/core";

import { fromStore } from "./store";

/**
 * Options for {@link injectSavedViews}.
 *
 * @public
 */
export interface SavedViewsOptions extends SavedViewsControllerOptions {
  /** The injector to run in. Omit inside an injection context. */
  readonly injector?: Injector;
}

/**
 * A table's saved views: the list and the default as signals, and what can
 * be done to them.
 *
 * @public
 */
export interface SavedViewsState extends Omit<
  UseSavedViewsResult,
  "views" | "defaultView"
> {
  /** The saved views, in list order. */
  readonly views: Signal<readonly SavedView[]>;
  /** The default view, when one is set. */
  readonly defaultView: Signal<SavedView | undefined>;
}

/**
 * Saved views for a table.
 *
 * @param options - Where the views are kept, and the table's URL backend.
 * @returns See {@link SavedViewsState}.
 *
 * @public
 */
export function injectSavedViews(options: SavedViewsOptions): SavedViewsState {
  if (!options.injector) assertInInjectionContext(injectSavedViews);
  const injector = options.injector ?? inject(Injector);
  // No backend at all — the server, blocked storage — keeps them in memory.
  const controller = createSavedViewsController({
    ...options,
    storage:
      options.storage === undefined
        ? (safeLocalStorage() ?? null)
        : options.storage,
  });
  injector.get(DestroyRef).onDestroy(controller.connect());
  const snapshot = fromStore(controller, { injector });
  return {
    views: computed(() => snapshot().views),
    defaultView: computed(() => snapshot().defaultView),
    save: controller.save,
    apply: controller.apply,
    remove: controller.remove,
    rename: controller.rename,
    move: controller.move,
    setDefault: controller.setDefault,
    reload: controller.reload,
  };
}
