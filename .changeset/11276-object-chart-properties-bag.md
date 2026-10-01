---
'@object-ui/types': minor
---

feat(types): an authored `object-chart` takes its props in the `properties` bag; the flat spelling is refused by name (objectui#11276)

**BREAKING (authoring):** an `object-chart` node that writes its props on the node itself is now refused by `safeValidateSchema`, `validateSchema` and the strict authoring face, and so by `objectui validate`. Move each prop into the node's `properties` bag:

```json
{ "type": "object-chart", "properties": { "chartType": "bar", "dataset": "task_metrics", "dimensions": ["status"], "values": ["task_count"] } }
```

Nothing changes at render time: `SchemaRenderer` hoists every `properties` key onto the node before `ObjectChart` runs, so the bag node draws what the flat one drew, and a node built in code (`ObjectView`, `ListView`, the dashboard renderers and the react-page wrapper all build a flat `object-chart` node) keeps working with its flat keys.

**Clause-②: yes (narrowing)** — the accept set narrows (a flat `object-chart` node that parsed is refused) and widens (a bag node that was refused parses). Released as `minor` under the objectui narrowing rule, with this banner.

**Why.** `@objectstack/spec`'s strict `PageComponentSchema` refuses a prop written on any page component itself as mis-layered (ADR-0089 D3a): `properties` is the only home of a component's props. The arm here was the flat mirror of the TypeScript `ObjectChartSchema`, so the two validators disagreed both ways: the objectstack showcase's command-center charts, written in the bag, were refused (the flat mirror found no chart family on the node), and the flat node `os validate` refuses was accepted.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `ObjectChartBlockSchema`, built the way `ObjectFormBlockSchema` and `ObjectMapBlockSchema` are: `BaseSchema`, the `object-chart` literal, the node-level `responsiveStyles`, and `properties`. One difference: `@objectstack/spec` has no `ComponentPropsMap['object-chart']` row, so the spec's page component takes any bag on this type, and no row is invented here. The bag's members are the members `ObjectChartSchema` already declares (beyond the node base), the same schema objects, so their value checks and spec bindings (`aggregate`, `series`, `drillDown`, `xAxis`, `yAxis`) judge the bag exactly as they judged the flat node.
- Each of those members written flat on the node is refused on both faces, with a message that names its bag member (`Did you mean \`chartType\` → \`properties.chartType\`?`). The refusal set is read off the bag. The three list-view spellings retired by objectui#10608 (`xAxisField`, `yAxisFields`, `aggregation`) keep their retirement message, on the node and in the bag.
- The chart-family floor stays, read in the bag: the node needs `properties.chartType` (or `properties.specType`). A node with neither is refused at `properties.chartType`, as the flat node was refused at `chartType`. The spec has no such rule.
- A key the chart does not declare stays as before, one layer down: unjudged by the tolerant face, refused by name by the strict face. `BaseSchema`'s keys (`className`, `hidden`, …) stay on the node. `dataSource` stays undeclared on this node, as objectui#11070 left it. `body` / `children` stay refused (objectui#9256).
- `ObjectChartBlockSchema` reaches `AnyComponentSchema` through `ObjectQLPublicBlockComponentSchema`. `ObjectChartSchema` leaves `ObjectQLComponentSchema`.

**The same release's `.changeset/10518-object-chart-y-axis-declared.md`, `.changeset/10608-object-chart-legacy-axis-keys-retired.md`, `.changeset/10770-object-chart-react-tier-node.md` and `.changeset/10872-flat-arm-responsive-styles.md`** describe what the validators say about an `object-chart` written flat. On an authored node those readings now happen in the bag: a malformed `xAxis` is refused at `properties.xAxis`, a retired key at `properties.KEY`, a missing family at `properties.chartType`; `responsiveStyles` stays node-level and is judged there as they say. The flat mirror they name still behaves as they say.

**What did not move.** The TypeScript `ObjectChartSchema` and its zod mirror `ObjectChartSchema` stay published and unchanged in shape. They are the node as `ObjectChart` reads it after the hoist, and as code composes it or hands it to `<ObjectChart schema={…}>` directly.

⚠️ **Dated note, 2026-10-01 — `dataSource` is declared on this node — objectui#11070.** "`dataSource` stays undeclared on this node, as objectui#11070 left it" above held when this change landed. Later in this same release objectui#11070 (round 7) declared it on `ObjectChartSchema` and on `ObjectChartBlockSchema`, at node level beside the bag, as the spec's `ElementDataSourceSchema` by reference: a binding parses on both faces, and a `dataSource` that is not a binding is refused. `.changeset/11070-grid-columns-chart-binding-round7.md` states what ships; the text above is kept as the reading of this change.
