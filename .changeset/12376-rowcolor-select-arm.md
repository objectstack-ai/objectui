---
'@object-ui/plugin-list': patch
---

A list view tinted by a field that is not one of its columns now colours its rows (objectui#12376).

`ListView` builds each request's `$select` from its columns plus the fields its view bindings, grouping and row predicates read. It did not add the row colour's field (`rowColor.field`), so a list whose `rowColor` named a field that was not a column fetched rows without it, and no row was tinted, with no error. The field is now requested, through the same gate as the other added fields: a field the viewer may not read, or one the object does not declare, is not requested.

Nothing is added to the package entry: no export, prop or type member.
