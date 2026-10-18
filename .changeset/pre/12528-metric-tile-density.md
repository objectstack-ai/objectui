---
'@object-ui/plugin-dashboard': patch
---

A dataset-bound metric tile on a dashboard is two lines, not four (objectui#12528).

`DashboardRenderer` framed a dataset-bound `metric` widget in its shared card: a header with the title and, under a rule, the description as a paragraph, then the tile with the value and, under it, the measure label. That is four lines for one number. The card now draws no header for that widget. The tile draws the title and the measure label on one line above the value, and the widget's description is the title's tooltip. The spec declares no widget key to show it inline, so it is not drawn anywhere else. Loading, refused and failed tiles keep the title line. Every other widget's card, and `DashboardGridLayout`, are unchanged.

**Clause-②: no.** `DatasetWidget` and its new `heading` parameter are not exported from the package entry.
