---
'@object-ui/plugin-charts': minor
---

**BREAKING** — `ObjectChartBlock`, the registry shell exported beside `ObjectChart`, declares its props instead of taking `(props: any)` (objectui#8885).

**Clause-②: yes** — a published component signature narrows. `@object-ui/plugin-charts` 17.6.0 publishes `ObjectChartBlock: (props: any) => React.JSX.Element`. It is now `(props: Omit<ObjectChartProps, 'schema'> & { schema: BaseSchema }) => React.JSX.Element`. No export is added, removed or renamed, and no runtime behaviour changes.

**FROM** any props bag **TO** `ObjectChart`'s own props, with `schema` as the raw node:

```tsx
// before: all of these compiled
<ObjectChartBlock schema={node} dataSorce={adapter} />   // misspelled prop, silently dropped
<ObjectChartBlock schema="object-chart" />                // a string, not a node
<ObjectChartBlock schema={{ objectName: 'deal' }} />      // a node with no `type`
// after: pass a node (`BaseSchema`: at least `type`) and only ObjectChart's props
<ObjectChartBlock schema={{ type: 'object-chart', objectName: 'deal', chartType: 'bar' }} dataSource={adapter} />
```

`schema` is `BaseSchema`, the node `SchemaRenderer` hands every registered renderer, and not `ObjectChartSchema`. The shell receives the node BEFORE `ElementDataSourceGate` maps its `dataSource` binding, so a node that carries only `{ type, dataSource: { object, view } }` is legal input. So is a node typed `chart`, the alias this same shell is registered under. The other props (`dataSource`, `onSegmentClick`) are `ObjectChartProps`' own, so a misspelled prop name is now an excess-property error.

Migration: a direct caller that passed extra props through the shell must pass only `schema`, `dataSource` and `onSegmentClick`, and a node without `type` must add one. Nodes rendered through the registry (`SchemaRenderer`) are unaffected: the registry resolves renderers as `any`, and the type annotations and the single hand-off cast erase at build.
