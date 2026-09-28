---
"@adapttable/react": minor
"@adapttable/antd": minor
"@adapttable/base-ui": minor
"@adapttable/chakra": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/radix": minor
"@adapttable/shadcn": minor
"@adapttable/unstyled": minor
"@adapttable/core": patch
---

A kit now talks only to its binding. `@adapttable/react/adapter` re-exports the core names the kits use (`defaultLabels`, `resolveLabels`, the filter registry helpers and 46 more), and `@adapttable/react/pivot` re-exports everything `@adapttable/core/pivot` exports, so no kit imports `@adapttable/core`. Each kit's `/pivot` entry forwards `@adapttable/react/pivot`, and so also offers `pivotTableModel` and `usePivotUrlState`. Nothing is removed or renamed, and bundle sizes are unchanged.

Core's deprecated main-entry copies of the adapter helpers now name their replacement in `@adapttable/core/binding`.
