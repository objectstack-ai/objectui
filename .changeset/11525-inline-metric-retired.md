---
'@object-ui/plugin-dashboard': minor
---

**A dashboard metric widget bound inline to an object now shows the
retired-format prompt instead of its number (objectui#11525).** This follows
the maintainer's ruling C on objectui#11525.

**What changes on screen.** The change covers a stored single-value widget:
`metric`, `gauge`, `solid-gauge`, `kpi`, `bullet`, or a widget with no `type`,
which draws as `metric`. If it has no `dataset` and its `options.data` (or
widget-level `data`) is `{ provider: 'object', object, aggregate }`, it is
affected:

- **Before:** both `DashboardRenderer` and `DashboardGridLayout` aggregated the
  object and drew the number in the tile.
- **Now:** the tile shows "This widget uses a retired data format. Edit it to
  bind a dataset." and sends no query. This is the same placeholder a `pivot`
  widget with that config already showed (objectui#10528).

Breaking for stored dashboards that still carry this form; `minor` because
objectui never declares `major`. Under ADR-0021 a widget binds a
semantic-layer `dataset`, and both validator faces already refuse a widget
without one, so nothing authored against the current contract is affected. No
example, objectui authoring surface, cloud dashboard or AI Studio path was
measured emitting the form (the measurements are on objectui#11525).

**The fix.** Rebind the widget to a dataset: set `dataset` and select its
`values` by name. A dataset-bound metric draws its number as before.

**What does not move:**

- The inline `provider: 'object'` chart and table widgets still draw.
- A static metric (`options.value` or an inline row array) still draws its value.
- The zod and TypeScript authoring faces are unchanged.
- An `object-metric` node an author places in a widget's legacy `component`
  envelope still receives the dashboard filter bar's values.

The flat `object-metric` node the two surfaces used to build carried an
ObjectQL-dialect `filter` that no node type declares; it is gone.

⚠️ **Dated note, 2026-10-03 — the envelope's `object-metric` is retired too — objectui#11466.** At this change, "An `object-metric` node an author places in a widget's legacy `component` envelope still receives the dashboard filter bar's values" held, because `object-metric` stayed in the filter broadcast's filterable set for that node. Now, by the maintainer's ruling A on objectui#11466 (extending this change's ruling C), that envelope node draws the same retired-format placeholder on both surfaces and sends no query, and `object-metric` left the filterable set. `.changeset/11466-envelope-object-metric-retired.md` states what ships. The rest of this entry is kept as the reading of this change.
