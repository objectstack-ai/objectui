---
'@object-ui/plugin-dashboard': minor
---

The dashboards' metric card node, `plugin-dashboard:metric`, is a declared node type, and both dashboard surfaces hand `SchemaRenderer` declared nodes with no cast (objectui#11466).

- **New export `DashboardMetricNodeSchema`:** the node `MetricWidget` renders under `plugin-dashboard:metric`, with the keys it reads off the node, typed by `MetricWidgetProps`. This package enters it in `@object-ui/types`' `CustomNodeRegistry` under that key, so a program that loads this package's typings has the node as a member of `DeclaredNode`: authorable in a node slot and at `SchemaRenderer`'s `schema` prop, with its keys checked.
- **`DashboardGridLayout`'s static `pivot` node** (a `pivot` widget drawn from inline rows) states the keys `PivotTableSchema` declares and `PivotTable` draws, read from `options`: `title`, `rowField`, `columnField`, `valueField`, `aggregation`, `showRowTotals`, `showColumnTotals`, `format`, `columnColors` and `className`. It used to spread `options` whole, so every option key became a key of the node, and `SchemaRenderer` handed each one on as a React prop. Now no other option key reaches the node: not a host prop of `PivotTable`'s (such as `rowLabels`), and not a `BaseSchema` node key other than `className` (such as `id`, `style` or `hidden`). Each key listed above draws as before.
- **The two surfaces' casts before `SchemaRenderer` are gone** (`DashboardGridLayout`'s `as BaseSchema | string | null | undefined` and `DashboardRenderer`'s `as BaseSchema`). Each surface's node builder returns `SchemaRenderer`'s own prop type, so every node is checked against its declared type where it is built. No runtime change.
