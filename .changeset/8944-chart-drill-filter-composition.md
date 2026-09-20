---
'@object-ui/core': minor
'@object-ui/plugin-charts': patch
'@object-ui/app-shell': patch
'@object-ui/types': patch
---

Compose an `ObjectChart` drill-down filter instead of spreading it, so the widget's own
filter survives into the drilled query for BOTH arms of `ObjectChartSchema.filter`
(objectui#8944).

**The defect.** `ObjectChartSchema.filter` admits a spec `FilterArray`
(`[['region','=','emea']]`) and the ObjectQL `$filter` object (`{ region: 'emea' }`),
and both are read — both travel verbatim to `ds.aggregate` / `ds.find`. The drill seam
composed them by spreading the widget's filter into an object literal, which is correct
for the object arm and silent nonsense for the array arm: spreading an array yields
index keys, so an authored `FilterArray` drilled as
`{ '0': ['region','=','emea'], stage: 'won' }` — the widget's conditions replaced by a
key the query layer ignores. Nothing errored; the drawer opened and looked right.

**Direction of the failure.** The widget's filter is what narrows. Dropping it made the
drilled list a **superset** — it showed records the chart itself was scoped to exclude.
Not a security boundary, but the worse direction for a silent bug.

**The composition rule, named rather than picked.** `widget.filter ∧ drill.filter`. The
two are independent filter sources and a drill must satisfy both: the click context only
says which bucket of the widget's scope was asked for, so it may narrow that scope and
never widen it. This is not a new rule — it is the contract `mergeFilterNodes` already
states ("combine filter sources under a single `and`, each as its OWN child"), the sink
every other multi-source filter in this repo goes through. A new
`composeDrillFilter` helper in `@object-ui/core` applies it at the drill seam and
documents it, then lowers the result back to the `FilterCondition` object dialect with
`parseFilterAST` — the spec's single lowering sink — because that is the dialect both
drill sinks take.

**Compatibility.** A lone surviving source lowers back to exactly the flat object the
spread produced, so a chart with no filter of its own drills byte-identically to before.
Only a genuinely composed pair gains the `$and`.

`serializeDrillFilterParams` (the drill "Open in list" / `target: 'navigate'` URL writer)
learns to flatten that `$and` into the flat `filter[...]` params its own read side already
ANDs back together. Without that it took the `String(value)` path — `$and` holds an array —
and emitted `filter[$and]=[object Object],[object Object]` while both real conditions
vanished, which is the outcome that function's contract says it never produces.
