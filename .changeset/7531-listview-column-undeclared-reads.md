---
'@object-ui/plugin-list': patch
---

`ListView` no longer reads relational keys off a list column while the object
definition is still loading (objectui#7531).

Until the definition arrives, the filter and sort candidates are built from the
view's declared `columns`. That fallback used to read `reference_to` /
`reference`, `display_field` / `reference_field` and `id_field` off each
column. `ListColumnSchema` declares none of them in either casing, so a
spec-compliant producer can never put one there, and the read only kept a
second, undeclared route alive (AGENTS.md 0.1). The candidate now carries what
a column declares; its relational target (`referenceTo`, `displayField`,
`idField`) comes from the object definition once it loads, as it already did.

Nothing changes for a spec-compliant view. A column that carried one of these
keys anyway now gets the same pre-load candidate as a column without it: the
filter's lookup value picker waits for the definition instead of taking the
column's word for the target.
