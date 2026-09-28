---
"@adapttable/core": minor
"@adapttable/react": patch
---

The query-library tier and the table data controller are framework-neutral: `createQuerySource` in `@adapttable/core` holds the rules `useQuerySource` ran on — merging base params under the live view, gating capabilities, projecting pages to rows, the cursor trail, clamping and the aggregate operations on screen — and `createTableData` holds `useTableData`'s — the tier choice, the merged filter runtime, facet keys, facets computed from the searched rows, async filter options and a frontend table's change notices. Both hooks run on them with their APIs unchanged. The cursor trail now restarts on the same inputs in both server tiers (`cursorTrailKey`: sort levels, grouping and the filter tree included), and `useQuerySource` returns to page 1 when it does, instead of asking for a later page without its token.
