---
'@object-ui/plugin-list': patch
---

On a `chart` list view bound to a semantic `dataset`, a user filter that is already set
no longer narrows `ListView`'s own fetch (objectui#10512).

The toolbar withholds the Filter builder and the `userFilters` chips on such a view
(objectui#10327), but a filter group the host restored at mount through
`initialFilters`, or a group or chip set on another view before switching, was still
applied to `ListView`'s own fetch of the object's rows. That fetch still runs on the
chart and feeds the record-count bar, so the count was narrowed by a filter nothing on
screen showed or could clear.

- While a dataset-bound chart is on screen, `ListView`'s fetch and its export apply
  the view's own `filter` only; the toolbar's filter group and the chips are not sent.
- The held state is kept rather than cleared: switching back to a view that offers the
  controls applies the same group again, and `onFilterChange` is not called for the
  switch.
- A chart bound to the list object, and every other view, apply the toolbar's filter
  group and the chips as before. A switch into a dataset chart with no user filter set
  issues no new request.
