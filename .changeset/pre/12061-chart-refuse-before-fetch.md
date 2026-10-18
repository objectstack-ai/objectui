---
'@object-ui/plugin-charts': patch
---

`ObjectChart` decides its missing-category-axis refusal before it fetches, so a chart that refuses reads nothing (objectui#12061).

The refusal (`chart-missing-category-axis`, objectui#8168) is drawn when an object-bound chart declares no category by any spelling (`aggregate.groupBy`, `xAxisKey`, `xAxis.field`). It was a render-time return only: the fetch ran anyway, issuing the object's `find` with no `$top` (or `aggregate` with no `groupBy`), and the rows were then discarded. Since objectui#6152 round 15, every chart list view that names no `dataset` composes that node, so each render of such a view paid for the read.

Now the refusal and the fetch read one value. A refused chart issues no `find`, no `aggregate` and no comparison query, and a data-invalidation event for its object does not start one. The refusal's code, `role="alert"` and wording are unchanged, and it is still the first paint, with no loading skeleton before it. A chart with a category fetches exactly as before. A chart that is refused at mount and later given a category (for example, a spec `xAxis` added in a designer preview) fetches at that point.
