---
"@adapttable/core": minor
"@adapttable/react": patch
---

The frontend tier is framework-neutral: `createFrontendSource` in `@adapttable/core` holds the rules an in-memory table runs on — the per-row search text cache and its invalidation on row patches, restaging the engine only when a value-level input moved, the facet rows (searched, before filters), one page slice per engine revision, and whether an infinite list has more. `resolvePaginationMode`, `defaultSearchText` and `defaultFrontendRowId` move to core with it. `useFrontendData` runs on the source with its API unchanged, and now reads the right page when a render stages more than one change before React commits it.
