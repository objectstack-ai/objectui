---
'@object-ui/components': minor
'@object-ui/plugin-list': minor
---

A list block in a page region narrower than half the page draws a compact list (objectui#12703).

The page renderer measures each region against the page body and tells the region's blocks their posture: `compact` when the region is narrower than half the page (an `aside` or `sidebar` rail beside `main`), `full` otherwise. The measurement is the region's rendered width relative to the page, never the viewport, so the same `aside` is compact beside `main` and full once a narrow screen stacks it. Nothing is authored: `@objectstack/spec` declares no posture or `compact` key, and none is added.

A `list-view` block in a compact region draws a header with its title and record count over two-line rows: the view's first visible column, with its second muted below. It draws no toolbar, no view tabs, no row-number column, no pager and no record-count bar. A click on a row opens the record the way a grid row does. A region half the page or wider, a region whose width is not known (server render, no `ResizeObserver`), and the object list page keep the full list unchanged. The compact list applies to a paged grid; a board, a calendar or a grouped grid keeps its own rendering.

Published surface:

- `@object-ui/components` exports `usePageRegionPosture()` and the type `PageRegionPosture` (`'compact' | 'full'`). The hook answers `null` outside a page region or before the width is known.
- `@object-ui/plugin-list`'s `ListViewProps` gains the optional host prop `compact`. It is a React prop, never a schema key; absent, the list renders as before.
