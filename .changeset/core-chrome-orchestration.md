---
"@adapttable/core": minor
"@adapttable/react": patch
---

Move chrome orchestration from the React binding into `@adapttable/core/binding`, so every binding assembles a table the same way.

- **Feature patch layer.** `applyTableFeatures`, `mergeFeaturePatches`, `getAppliedFeatures` and `rememberAppliedFeatures`, the `FeaturePatch` and `PatchFeature` types, and one `core*` export per built-in feature factory (`coreCellSpan`, `coreGrouping`, …): its id and option normalization.
- **Standard preset.** `standardFeatureList` owns the preset's members, their order and the `findButton` flag.
- **Shell pipeline.** `CHROME_EXTRA_SLOT_ORDER`, `SHELL_LIVE_STAGE_ORDER`, `TableRuntimePublisher` with its runtime view, `cellNavigationInput`, the toolbar prop builders, `finishShellLive`, `overlayChromeExtras` and `finishShellBody`.
- **Table chrome state.** Body region, empty and refreshing variants, footer, clear filters, the selection observer, reorder enablement, grouping-panel state, feature notices, `FilterTriggerToggleState` and the scroll-reset keys.
- **Desktop assembly.** Row wiring and its memo policy, body slot order, the sticky plan, pin edges, head and edge styles, the table style and header leaves.
- **Body windows.** `chromeRenderModel`, `SummaryCellsCache`, the body window plan, the virtual window math, the column window and `RowPairMeasureController`.

`@adapttable/react` now delegates to these. Its public API is unchanged: the types it re-exports from core keep their names and shapes.
