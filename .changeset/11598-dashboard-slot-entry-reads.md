---
'@object-ui/plugin-dashboard': patch
---

The dashboard surfaces type the `chart` node they build without leaning on `BaseSchema`'s index signature (objectui#11598).

**N1, the `chart` producers.** `DashboardRenderer` and `DashboardGridLayout` build a `chart` node for a series widget bound to inline rows, and compose two render keys onto it: the dashboard palette (`colors`) and `isAnimationActive: false`, the deterministic first paint inside the grid (#2756). `ChartSchema` declares neither key, on either face, and the chart renderer reads both. Each producer now checks its literal against a hand-off type private to this package, `ChartSchema` plus those two keys, and hands the node on with no cast; the type is not exported, and the keys stay off `@object-ui/types`, because the strict authoring face refuses both on an authored `chart` node. Nothing drawn changes.
