---
'@object-ui/plugin-kanban': patch
'@object-ui/types': patch
---

fix(plugin-kanban): `object-kanban` honours the binding's `dataSource.sort`

The per-element binding declares `{ object, view, filter, sort, limit }` for every
block, and `object-kanban` accepted `dataSource.sort` (or a named view's `sort`)
and then dropped it: the board's fetch carried no `$orderby`, with no error and no
warning. `OBJECT_KANBAN_DATA_SOURCE` now maps `sort`, and the fetch lowers it onto
`$orderby` through `convertSortToQueryParams`, the same way the calendar, map,
gantt and timeline blocks do. Lanes bucket records in fetch order, so the declared
order is also the order of the cards inside each lane. With no declared `sort` the
query is unchanged.

`@object-ui/types`: doc comments only. The `ObjectKanbanSchema` notes that said the
board has no `schema.sort` read site now say that the board reads it only as the
gate's carrier for `dataSource.sort`. No top-level `sort` key is declared on
`object-kanban`, because the spec declares none.
