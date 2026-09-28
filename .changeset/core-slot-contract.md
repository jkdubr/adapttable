---
"@adapttable/core": minor
"@adapttable/react": patch
---

`@adapttable/core/binding` now owns the whole slot contract, so a binding other than React can fill every position a kit fills today:

- Every slot key the React binding declared (the status bar, find bar, batch-edit bar, command palette, context menu, side panel, bulk bar, filters form, editable cell, fill handle, toolbar extras, tree, row editing, row reorder, group headers, column select and every `*_LIVE` key), with the same ids and `single` flags.
- The props every kit control receives, from the checklist, filter tree, header filters, grouping and pivot panels, saved views, side panel, command palette, context menu, row and batch editing, editable cell, row reorder, tree toggle, column select, fill handle, multi-select editor, find bar, status bar, export progress, agent approval and table assistant. Rendered content is a `TNode` type parameter and key, drag and style types are parameters too.
- The agent feature-state keys (`AGENT_APPROVAL_STATE` and its relatives), `FILTER_ENGINE`, `GROUPING_PANEL_STATE`, `TableAssistantView`, `assistantIsBusy` and `assistantIsUsable`.
- The table's glyphs as path data (`FILTERS_ICON`, `SEARCH_ICON`, `expandChevronIcon`, `GRIP_ICON`, `eyeIcon`, `PIN_ICON` and the assistant's avatars and glyphs), `OVERLAY_MOTION`, `MOUNT_STAGGER`, `FORCED_COLORS_CSS` with `ensureForcedColorsStyles`, and the display helpers (`groupRowParts`, `mergedCellStyle`, `cellHighlightKind`, `cellHighlightStyle`, `groupIndentStyle`, `pinnedEdgeCellStyle`, `logicalAlign`, `sortArrow`, `resolveMobileLabel` and the rest).

`@adapttable/react` imports all of these from core and re-exports each under its current name and entry point; its API and rendering are unchanged.
