---
'@object-ui/plugin-list': patch
---

On a `gantt` list view, the toolbar's Filter control and the `UserFilters` chips now
narrow the chart (objectui#10037).

Both controls were offered on a gantt view and changed nothing the user could see.
`ListView`'s own fetch applies the authored filter, the toolbar's filter group and the
chips together, but the gantt chart does not draw those rows: it queries for itself —
its registered renderer takes only the node's `schema` — and the node it was handed
carried the authored `filter` alone.

The gantt node now carries the same effective filter `ListView`'s own fetch sends, so the
chart's query honours both controls. The value keeps its identity while its content is
unchanged, so re-rendering the list does not re-query the chart. The row ceiling from
objectui#7210 is untouched.
