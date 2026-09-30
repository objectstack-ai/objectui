---
'@object-ui/plugin-list': patch
---

On `tree` and `chart` list views, the toolbar no longer offers Search (objectui#10326).

Both views draw what they query for themselves, and neither query carries a search
term: the tree's own `find` sends its filter, its row ceiling and its expansions, and
the chart's queries, aggregate or dataset, take no term at all. A term typed there
changed `ListView`'s own fetch, behind the record count and the export, and nothing
the view drew.

- The Search control is not rendered while a `tree` or `chart` view is on screen,
  whatever the chart is bound to. An authored `userActions.search: true` does not bring
  it back on those views. Grid, kanban, calendar, gallery, timeline, map and gantt views
  keep it as before.
- A term that is already set, whether the host restored it at mount through
  `initialSearchTerm` or the user typed it on another view before switching, is not
  applied to `ListView`'s own fetch or export while a `tree` or `chart` view is on
  screen. The term is kept rather than cleared: switching back to a view that offers
  Search applies it again, and `onSearchChange` is not called for the switch.
