---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): a dimensionless `column` / `horizontal-bar` draws every measure; the dropped-measure warning speaks whenever the widget's own branch leaves a declared measure off the screen; the widget panel stops offering a measure the widget door refuses (objectui#8894)

**`column` and `horizontal-bar` draw every measure of a dimensionless widget.** They are
the bar family in another orientation, so the spec's "the chart families render one mark
per measure" covers them, and they now take the same measure transposition `bar` took in
objectui#11261: one mark per measure, the measures' labels along the bottom on a `column`
and down the side on a `horizontal-bar`. Before, a `horizontal-bar` over revenue, cost and
margin with no dimension rendered as a one-number tile showing revenue alone. A
single-measure dimensionless widget keeps the tile, as on every type.

**The dropped-measure warning fires on what the widget's own branch does not render.**
`DatasetWidget` derives the measures it renders once, from its branch decision, and both
the tile and the console warning read that derivation; the warning speaks when a declared
measure is not among them, never from a list of types. Two shapes take the tile with
several measures: a metric-family tile stored before `@objectstack/spec` 17.5.0 refused
that shape at its door, and a dimensionless widget of a type the spec gives no rendering
of several measures (`pie`, `donut`, `funnel`, `scatter`, `radar`, `treemap`, `sankey`),
which takes the tile until the spec refuses that shape too. The warning is a diagnostic:
it names the widget, the measures it renders and the ones it queried and never displayed,
and points to the `replacement` of the spec's ADR-0087 entry
`dashboard-widget-metric-family-multi-measure-refused`. It names no widget types and
gives no advice of its own. A table, a chart that draws every measure and a
single-measure tile stay silent. A dimensioned `pie`, `donut`, `funnel`, `treemap` or
`sankey` with several measures draws only the first, and the warning names the measures
it drops there too (objectui#11417).

**`WidgetConfigPanel`'s measure picker follows the widget door.** It asks objectui's
`DashboardWidgetSchema` (which re-attaches the spec's own measure check) instead of
carrying a list of types: when one more measure would be refused, as on any
metric-family widget that already has one, the add control is not offered; when the
widget's measures are already refused (a stored document, or a type switched under
them), the door's own message is shown under them at once rather than at publish. Every
other widget type keeps offering further measures exactly as before.
