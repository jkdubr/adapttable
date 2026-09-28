---
"@adapttable/core": minor
"@adapttable/react": patch
---

The editing pipeline is framework-neutral: `@adapttable/core` now holds the live-update conflict reconciler (`createEditConflictStore`), the cell commit pipeline (`editableCellController` — the validation gate, the hold while an async check decides, the send to the host, dirty marks and commit-and-advance), the row-form, batch and dirty-cell stores (`createRowEditStore`, `createBatchEditStore`, `createDirtyCellStore`), the edit history controller (`createEditHistory`), the gate rules every binding draws the same (`resolveEditingArming`, `editableCellPresentation`, the activate and row-form keys, `resolveRowEditTrigger`, `rowEditConflict`, the row and batch control layouts) and the approval review model (`approvalReview`). Each store has a `*View` that builds the state a binding hands its cells. React's editing hooks run on these stores with their API unchanged.
