---
'@object-ui/plugin-dashboard': minor
---

`DashboardRenderer`'s `onWidgetsReorder` hands back the slot's own array type, `DashboardComponentSchema['widgets']`, instead of `DashboardWidgetSchema[]`, and the dashboard's `object-chart` producers name `ObjectChartSchema` (objectui#11514). `minor`, per this repository's version alignment: a reorder handler typed `(widgets: DashboardWidgetSchema[]) => void` stops compiling, because the component arm of a `widgets[]` entry is no longer assignable to `DashboardWidgetSchema`. Type the handler's parameter as `DashboardComponentSchema['widgets']`.

- **Slot-entry reads.** `DashboardRenderer`, `DashboardGridLayout`, `DashboardWithConfig` and the retired-widget detector read a `widgets[]` entry by the slot's element type, `DashboardComponentSchema['widgets'][number]`, which is what lets `@object-ui/types` drop the component type from `DashboardWidgetSchema['type']`.
- **The `object-chart` producers.** A series dispatch carries the family as a literal union whose members are all families `ObjectChartSchema.chartType` declares, so the node both surfaces build for a `provider: 'object'` series widget satisfies `ObjectChartSchema` with no cast.
- **README.** "Reading a widget key off `widgets[]`" narrows an entry on `type` before reading a widget key, instead of annotating the array as `DashboardWidgetSchema[]`.
- **What does not move.** Nothing renders differently: the dispatch routes the same families, and each `object-chart` node carries the same `chartType` it carried before.
