---
"@adapttable/angular": minor
---

The Angular binding gains what a full table needs beside its rows:
`injectRowSelection` (row selection with the checkbox attributes),
`injectGridFocus` (keyboard cell navigation over core's grid-focus
controller) and `AdaptLiveRegion` (a polite, visually hidden live region).
`injectDataTable` now takes a `selection` and reports the body region, the
empty-state variant, the pager's pages and page sizes, loading more rows of
an infinite list, the card attributes and the status sentence a sort or a page speaks; `AdaptAttrs` applies key,
focus and mouse handlers, the `checked` and `indeterminate` properties and
a `ref`.
