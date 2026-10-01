---
'@object-ui/types': minor
'@object-ui/app-shell': patch
'@object-ui/plugin-dashboard': patch
'@object-ui/plugin-designer': patch
---

fix: the widget width / height editors write a whole four-number `layout` (objectui#11388)

The three dashboard widget width / height editors (Studio's widget inspector in
`@object-ui/app-shell`, `DashboardWithConfig` in `@object-ui/plugin-dashboard` and
`DashboardEditor` in `@object-ui/plugin-designer`) each spread the one edited
dimension onto the widget's possibly-absent `layout` and cast the result past the
declared four-number type. On a widget with no `layout`, which is how Studio adds
one, they stored `{ w }` or `{ h }`, and `@objectstack/spec`'s widget `layout`
refuses that box at `x`, `y` and the other dimension.

`@object-ui/types` gains two exports on its main entry:

- `defaultWidgetPlacement(index)`: the box the dashboard grid auto-places the
  widget at that position of `widgets[]` in when it has no `layout`, the fallback
  the spec's widget `layout` states (`x: (i % 4) * 3`, `y: Math.floor(i / 4) * 4`,
  `w: 3`, `h: 4`).
- `completeWidgetLayout(layout, patch, placement)`: the whole box after an edit,
  each coordinate taken from the edit, else from the stored `layout`, else from
  the placement.

All three editors now write through `completeWidgetLayout`, seeding from
`defaultWidgetPlacement` for the widget's index, and the casts are gone, so the
compiler judges each write. A widget that has a `layout` keeps its `x` and `y`.
The width and height inputs (and `DashboardWithConfig`'s sliders) show the same
completed box, so a widget with no `layout` now shows the auto-placed 3 × 4 where
it showed 1 × 1, and the dimension an edit leaves alone is the one on screen.
`DashboardGridLayout` places a widget with no `layout` through
`defaultWidgetPlacement`, with no change to where it lands.

`DashboardWithConfig`'s `onWidgetSave` payload keeps its flattened `layoutW` /
`layoutH` shape. For a widget with no `layout` that the author did not resize,
the two values it carries are now the auto-placed 3 and 4, not 1 and 1.
