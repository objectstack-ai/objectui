---
'@object-ui/components': minor
---

`element:number` reads its object from the node-level `dataSource` binding, as the spec declares it (objectui#10909).

`PageComponentSchema.dataSource` is the spec's per-element data binding, and the spec lint gate waives a missing `properties.object` when `dataSource.object` names one. `ElementNumberRenderer` read its object only from `properties.object`, so a metric written `{ type: 'element:number', dataSource: { object: 'contact' }, properties: { aggregate: 'count' } }` — which the spec lint gate accepts, as `objectui validate` will once objectui#10908 arms the type — issued no query and painted the empty dash, with nothing to tell the author why.

The renderer now resolves the binding the way `element:record_picker` does:

- `object` is `dataSource.object ?? properties.object`, resolved once and used for the fetch guard, the `aggregate` / `find` call and the data-invalidation bus key. The binding wins when both are set.
- A named `view` is honoured: its filter scopes the aggregate. A view that cannot be resolved renders the shared "data source could not be resolved" panel and aggregates nothing, rather than counting every record of the object.
- `properties.filter` is AND-combined with the binding's `filter` and with its view's, the rule every block behind `ElementDataSourceGate` applies: neither is dropped, so a validated `properties.filter` can never be discarded and widen the count. A filter the converter refuses while combining them renders the same configuration-error panel, naming the refused rule, and aggregates nothing.
- The binding's `sort` and `limit` are not read: an aggregate has no ordering, and a capped count would be a wrong number.

A metric with no `dataSource` behaves exactly as before.

**The registration's declared inputs move.** `element:number` is now registered through `elementDataSourceBlock`, so its registration and the published manifest declare the `dataSource` input (the one injected declaration every reader of the binding carries), and the html tier no longer reports `has no prop "dataSource"` on the node. `object` is no longer `required`, because the binding can supply it; its description, and a new `filter` description, say how each combines with the binding.

**Clause-②: yes (widening)** — no export moves, but the published `element:number` entry in `sdui.manifest.json` widens: it declares `dataSource`, and `object` is no longer `required`. The html tier, and the objectstack CLI's JSX gate that reads this manifest, therefore accept a node bound through `dataSource` alone — and also one that names neither `object` nor a binding, which no longer draws `missing-required-prop` and paints the empty dash.
