---
'@object-ui/plugin-list': minor
---

The view switcher's views are typed as `@object-ui/core`'s `ListViewVisualization`, and this package no longer re-exports that union as `ViewType` (objectui#6349, batch 7). `@object-ui/types` publishes a different `ViewType`: the whole view-type vocabulary, which adds the `list` and `detail` categories to the nine visualizations the switcher draws. One exported name stood for two unions across the two packages.

**Type change, breaking for some consumers.** `ViewType` is no longer exported from `@object-ui/plugin-list` (TS2305 on import). Import `ListViewVisualization` from `@object-ui/core` instead; it is the same nine-member union. The switcher's props keep their members, and `ListViewSwitcherProps['currentView']` names the same union (the props were renamed from `ViewSwitcherProps` in objectui#6349, batch 8).

No runtime behaviour changes.
