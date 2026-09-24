---
'@object-ui/plugin-list': patch
'@object-ui/plugin-gantt': minor
'@object-ui/types': minor
---

On `tree` and `chart` list views, the toolbar's Filter control and the `UserFilters`
chips now narrow the view, and on a `gantt` list view the toolbar's Search box now
narrows the chart (objectui#10250).

These three views run their own query instead of drawing the rows `ListView` fetched.
The tree and chart nodes carried only the authored `filter`, and the gantt node carried
no search term, so each control changed `ListView`'s own fetch and nothing on screen.

- The `tree` node and the object-bound `chart` node now carry the same effective filter
  `ListView`'s own fetch sends, as the `gantt` node has since objectui#10037. The value
  keeps its identity while its content is unchanged, so re-rendering the list does not
  re-query the view.
- `ObjectGanttSchema` declares two optional keys, `search` and `searchableFields`.
  `ObjectGantt` sends `search` as `$search` and, only alongside a term,
  `searchableFields` as `$searchFields` — the pair a list's own query sends. A `gantt`
  list view writes both from its toolbar Search box and the view's `searchableFields`.

Unchanged: a `chart` view bound to a semantic `dataset`, and the toolbar Search box on
`tree` and `chart` views, still do not reach those views' queries.
