---
'@object-ui/plugin-dashboard': patch
---

A metric widget with no `layout` on a dashboard that declares `columns` now spans one grid row instead of two, the same height the dashboard designer gives a new widget. The tile grows to its content, so it no longer draws an empty lower half. Widgets with an authored `layout.h` keep it, and other widget types keep their four-row default.
