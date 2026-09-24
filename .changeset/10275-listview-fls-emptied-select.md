---
'@object-ui/plugin-list': patch
---

fix(plugin-list): a list view whose every authored column is denied by field-level security still sends a `$select`

`ListView`'s `$select` builder drops the authored columns the principal cannot read. When that left no column, it returned no projection, so the request carried no `$select` key and asked the server for every field of the object, the denied ones included. An emptied column list was read as "no restriction", the reading objectui#7215 fixed on `$expand` (objectui#10275).

The builder now asks whether the author declared any column, not whether any column survived the permission gate. An authored list that field-level security empties projects to `id` plus the fields the builder already adds through its FLS-gated routes (the platform columns every object carries excepted, as before): the `$expand` roots, the view bindings (kanban, calendar, gallery, timeline and gantt fields), the grid's grouping fields, and the operands of the row predicates (conditional formatting; the `visible` / `disabled` predicates and `recordIdField` of the row actions, the bulk actions and the object's declared actions; the object's `userActions` overrides). A denied operand is not added back. That is the shape `ObjectGrid` and `RelatedList` (objectui#10186) send.

Graded as defence in depth: ObjectStack's server strips denied fields from every returned row (`FieldMasker`), so nothing leaked from that backend. The projection matters for a backend that does not strip.

Unchanged: a list with no authored `columns` (absent or an empty array) still sends no projection, a partially-denied list projects its surviving columns as before, and nothing is filtered before the permission answer has loaded.

Behaviour to know about: on a backend that honours `$select`, a list whose every column is denied now receives rows carrying only the projected fields, as a list with one readable column already did.
