---
'@object-ui/plugin-dashboard': patch
---

A dataset-bound metric tile on `DashboardGridLayout` is two lines, not three (objectui#12573).

`DashboardGridLayout` framed a dataset-bound `metric` widget in its card: a header with the title (and, in edit mode, the drag handle), then the value, then the measure label. It now draws the tile the way `DashboardRenderer` does since objectui#12528: no card header, and `DatasetWidget` draws the title and the measure label on one line above the value. Both surfaces hand `DatasetWidget` the same `heading`, so that line has one derivation. The widget's description, which this surface did not draw before, is the title's tooltip. In edit mode the drag handle sits over the tile's top-right corner. Every other widget's card is unchanged, and so is what `layout.h` buys.
