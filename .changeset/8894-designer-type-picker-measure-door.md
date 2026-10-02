---
'@object-ui/plugin-designer': patch
---

fix(plugin-designer): the dashboard editor's type picker no longer turns a multi-measure widget into a type the widget door refuses (objectui#8894)

`@objectstack/spec` 17.5.0 refuses a second measure on a metric-family widget. The
dashboard editor authors no measures, but a dashboard it opens carries them, and its
type picker could turn a stored `bar` over two measures into a `metric` that publish
then refused — a refusal `DashboardDesignPage`'s save swallows. The picker now asks
objectui's `DashboardWidgetSchema` (which re-attaches the spec's own check) before it
offers a type: a type the door refuses this widget's measures under is a disabled
option, and a change to it writes nothing. A stored widget the door already refuses
keeps its type and shows the door's own message under the picker. A widget with one
measure, or none, is offered every type as before.
