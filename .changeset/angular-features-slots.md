---
"@adapttable/angular": minor
---

The Angular binding composes features with slots. An `AdaptTableFeature` can
now `apply` configuration and `renders` components into named slots, drawn by
`AdaptSlot`; `extendFeature` lets a kit add its own controls to a core
feature. New for kits and hosts:

- column layout: `ColumnLayoutOptions` on `injectDataTable`, the table's
  `layout` signal, `injectColumnDrag` and `injectColumnRenameEditor`;
- filters: `filterRuntimeFor`, `filterChipsFor`, `filterOptionsFor`, the
  field widgets `textFilterFor`, `rangeFilterFor` and `booleanFilterFor`, and
  the `AdaptFilterTreeChrome` and `AdaptChecklistChrome` structures that draw
  a kit's own controls;
- actions: `injectBulkActionRunner` and `rowActionsFor`;
- toolbar: `injectDensity`, `injectFullscreen`, `injectExportCsv`,
  `injectSavedViews` and `urlAdapterFor`;
- `AdaptControl` and `AdaptIcon` for drawing kit controls and core glyphs.
