---
'@object-ui/plugin-grid': patch
---

A grid that fetches its own rows and is tinted by a field that is not one of its columns now colours its rows (objectui#12393).

`ObjectGrid` builds its own `$select` when it fetches for itself: a standalone `object-grid`, and a grouped list view whose data source can group on the server. That projection took the columns, the fields its predicates read, the grouping fields and the concurrency token, but not the row colour's field (`rowColor.field`), so no row was tinted, with no error. The field is now requested through the same gates as the other added fields: a field the viewer may not read, or one the object does not declare, is not requested. A rule that names a new field re-reads the rows; a change to its colours alone does not.

Nothing is added to the package entry: no export, prop or type member.
