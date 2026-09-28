---
"@adapttable/core": minor
"@adapttable/react": patch
---

The server tier is framework-neutral: `createServerSource` in `@adapttable/core` holds the rules a table whose host fetches each page runs on — one consolidated query per real change with the superseded request aborted, `isLoading` for the first load only, clamping a page past the end, the cursor trail, appending infinite pages, and which aggregate operations the rows on screen were computed with (`createResponseAggregateOps`). `useServerData` runs on the source with its API unchanged.
