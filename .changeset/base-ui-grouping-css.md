---
"@adapttable/base-ui": patch
---

The grouping strip's styles are injected by the grouping panel instead of with every table, so a plain `DataTable` no longer carries rules for a feature it never renders. `styles.css` still holds the whole sheet for hosts that import it.
