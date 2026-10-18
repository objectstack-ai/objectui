---
'@object-ui/plugin-list': minor
---

The props of this package's view switcher are declared and exported as `ListViewSwitcherProps` instead of `ViewSwitcherProps` (objectui#6349, batch 8). `@object-ui/plugin-view` publishes a different `ViewSwitcherProps`: the props of its `view-switcher` renderer, which takes a `ViewSwitcherSchema` and host callbacks and is keyed on the whole `ViewType`. This package's switcher takes `currentView` and `availableViews`, keyed on `@object-ui/core`'s `ListViewVisualization`. One exported name stood for two props types across the two packages.

**Type change, breaking for some consumers.** `ViewSwitcherProps` is no longer exported from `@object-ui/plugin-list`. Replace `import type { ViewSwitcherProps } from '@object-ui/plugin-list'` with `ListViewSwitcherProps`; the members (`currentView`, `availableViews`, `onViewChange`, `className`, `animated`) are unchanged. The compiler names the replacement (TS2724, "Did you mean 'ListViewSwitcherProps'?"). The `ViewSwitcher` and `ViewSwitcherDropdown` components keep their names.

No runtime behaviour changes.
