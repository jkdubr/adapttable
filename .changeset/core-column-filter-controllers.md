---
"@adapttable/core": minor
"@adapttable/react": patch
---

The column menu and the filter panel are framework-neutral. `@adapttable/core` now holds the column layout controller (`createColumnLayoutController`, with the rename baselines a reset restores), the layout storage write policy (`writeStoredColumnLayout`), the column reorder model and the inline rename editor, plus the filter models: the operator-first range, text and boolean fields, the AND/OR filter-tree builder, the active-filter chips, the checklist filter and its window, and the per-column header filter cells. The React hooks and Chrome run on them with their API unchanged. Filter-tree chips now label a custom filter type's operators through its registry widget, the same words the builder shows, instead of the raw operator strings.
