---
"@adapttable/core": minor
"@adapttable/react": patch
---

The table's feature controllers are framework-neutral. `@adapttable/core` now holds the logic the React binding used to own, so a second binding can drive the same behavior:

- Columns: the column layout controller (`createColumnLayoutController`, with the rename baselines a reset restores), the layout storage write policy (`writeStoredColumnLayout`), the column reorder model and the inline rename editor.
- Filters: the operator-first range, text and boolean fields, the AND/OR filter-tree builder, the active-filter chips, the checklist filter and its window, and the per-column header filter cells.
- Rows and grouping: the grouping panel and its runtime, group paging and collapse, lazy tree children, row actions and row reorder runtimes, cell navigation and context-menu copy.
- Panels and bars: the find bar, shortcuts, the bulk action runner, the saved views panel, export progress, the status bar, the side panel, sticky toolbar and density, Escape-to-close and focus restore, row highlights and changed-cell flash, the all-matching selection scope, the pivot layout and panel, sparkline geometry and nested table defaults.

The React hooks and Chrome run on them with their public API unchanged; names React exported before are now re-exported from core. Filter-tree chips now label a custom filter type's operators through its registry widget, the same words the builder shows, instead of the raw operator strings.
