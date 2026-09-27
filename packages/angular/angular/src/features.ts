/**
 * Feature composition through dependency injection: every feature provided
 * in an injector registers against each table created in it.
 */
import {
  createFeatureHost,
  disposeFeatureHost,
  type FeatureHostState,
  type FeatureSetup,
  type SidePanelEntry,
} from "@adapttable/core/binding";
import {
  DestroyRef,
  type EnvironmentProviders,
  InjectionToken,
  type Injector,
  makeEnvironmentProviders,
} from "@angular/core";

/**
 * A feature a table composes: anything with a `setup` that registers filter
 * types, editors, aggregators, writers, commands or menu entries.
 *
 * @public
 */
export type AdaptTableFeature = FeatureSetup<unknown, SidePanelEntry>;

/**
 * The features every table in this injector composes. Multi-provided: each
 * {@link provideAdaptTableFeatures} call adds to the list.
 *
 * @public
 */
export const ADAPTTABLE_FEATURES = new InjectionToken<
  readonly AdaptTableFeature[]
>("ADAPTTABLE_FEATURES");

/**
 * Provide features to every table created under this injector — in
 * `bootstrapApplication`, a route's `providers`, or a component's.
 *
 * @param features - The features.
 * @returns The providers.
 *
 * @public
 */
export function provideAdaptTableFeatures(
  ...features: readonly AdaptTableFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders(
    features.map((feature) => ({
      provide: ADAPTTABLE_FEATURES,
      useValue: feature,
      multi: true,
    }))
  );
}

/**
 * The feature host for a table: every provided feature and every one the
 * table names, set up once and disposed with the injection context.
 */
export function featureHostFor(
  injector: Injector,
  own: readonly AdaptTableFeature[] | undefined
): FeatureHostState {
  const provided =
    injector.get(ADAPTTABLE_FEATURES, null, { optional: true }) ?? [];
  const host = createFeatureHost([...provided, ...(own ?? [])]);
  injector.get(DestroyRef).onDestroy(() => {
    disposeFeatureHost(host);
  });
  return host;
}
