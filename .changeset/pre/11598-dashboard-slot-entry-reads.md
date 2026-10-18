---
'@object-ui/plugin-dashboard': patch
'@object-ui/plugin-designer': patch
'@object-ui/types': patch
---

The dashboard surfaces read every `widgets[]` entry without leaning on `BaseSchema`'s index signature: a widget key is read on the widget arm alone, and the `chart` node is built as a private hand-off type (objectui#11598).

**N1, the `chart` producers.** `DashboardRenderer` and `DashboardGridLayout` build a `chart` node for a series widget bound to inline rows, and compose two render keys onto it: the dashboard palette (`colors`) and `isAnimationActive: false`, the deterministic first paint inside the grid (#2756). `ChartSchema` declares neither key, on either face, and the chart renderer reads both. Each producer now checks its literal against a hand-off type private to this package, `ChartSchema` plus those two keys, and hands the node on with no cast; the type is not exported, and the keys stay off `@object-ui/types`, because the strict authoring face refuses both on an authored `chart` node. Nothing drawn changes.

**N2, widget keys on the slot entry.** An entry of `widgets[]` is a widget or a component node placed in the slot (a `metric-card`), and only the widget declares the widget keys (`dataset`, `options`, `chartConfig`, `filter`, `component`, `colorVariant`, `values`, `dimensions`, …). Every read of one now narrows the entry to the widget first, on `DashboardRenderer`, `DashboardGridLayout`, `DashboardWithConfig` and `DashboardEditor`. What changes is confined to a `metric-card` entry that carries a widget key, which `@object-ui/types/zod`'s strict face refuses and only the tolerant face accepts:

- a `metric-card` carrying `dataset` draws its card; it used to draw the dataset tile in the card's place, on both dashboard surfaces;
- a `metric-card` carrying `options` draws its own keys; `options` used to be spread over them, so `options.value` replaced `value`;
- a `metric-card` carrying a `component` draws its card; the envelope's node used to be drawn instead.

A document the strict face accepts draws exactly as before. `@object-ui/types`' docblocks on `DASHBOARD_COMPONENT_WIDGET_TYPES` and the Zod widget vocabulary, which described the dataset tile in the card's place and the `options` spread as live, were corrected to match; no type in it changes. In `DashboardEditor`, a `metric-card` entry is no longer offered the Color Variant select: the card declares no `colorVariant`, `MetricCard` draws nothing from it, and a pick stored a key publish refuses. A widget is offered it as before.
