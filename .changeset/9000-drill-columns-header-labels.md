---
'@object-ui/plugin-dashboard': patch
---

An authored drill `columns` whitelist no longer degrades the headers of the table it
narrows (objectui#9000).

`ObjectDataTable` derives its column headers on two branches of one memo, and both call
the same `fieldLabel` lookup. Only the fallback differed: the auto-derived branch fell
back to the humanized field key, the explicit-whitelist branch fell back to whatever
`header` the caller supplied. Both drill callers build `{ accessorKey: c, header: c }`
out of a `drillDown.columns` string list, so that fallback was the raw field key — and
with no bundle entry to resolve, which is the ordinary case in a drill, authoring
`columns` rendered `close_date` where the same table without a whitelist rendered
`Close Date`. The more deliberate configuration produced the less finished table.

The whitelist branch now falls back to the same humanized key the auto-derived branch
uses. **Visible change:** a drill-through list configured with `drillDown.columns` (the
pivot, metric and chart drill surfaces) renders humanized headers where it previously
rendered raw field names. Nothing else about the whitelist changes — it still narrows
the table to exactly the listed columns, in the listed order.

The fallback is **conditional**, and deliberately so: it fires only where the column
carries no display text, or carries the raw field key itself. An author-written label —
`{ accessorKey, header }` or the spec-canonical `{ field, label }`, both of which
`normalizeColumns` resolves onto the same key, and both of which `DashboardRenderer`
forwards here verbatim from an authored widget — is left exactly as authored. A
translated bundle entry still wins over both, unchanged.
