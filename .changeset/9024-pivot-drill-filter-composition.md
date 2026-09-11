---
'@object-ui/plugin-dashboard': patch
---

Compose an `ObjectPivotTable` drill-down filter instead of spreading it, so the pivot's own
filter survives into the drilled query for BOTH dialects it reads (objectui#9024).

**The defect.** The drill seam composed the pivot's filter with the click context by spreading
the first into an object literal — the identical statement objectui#8944 removed from
`ObjectChart` one block over. Spreading an array yields index keys, so a pivot scoped by
`[['region','=','emea']]` drilled as `{ '0': ['region','=','emea'], stage: 'won', source: 'web' }`
— the pivot's conditions replaced by a key the query layer ignores. Nothing errored; the drawer
opened and looked right, scoped by the clicked cell alone.

**Direction of the failure.** The pivot's filter is what narrows. Dropping it made the drilled
list a **superset** — it showed records the pivot itself was scoped to exclude.

**Why the array arm is reachable here.** `PivotTableSchema` declares no `filter` at all (the
type that admits the value is a local props-intersection `filter?: any`), so nothing refuses the
array form — and it is not only a hand author who can produce it. `object-pivot`'s registry entry
advertises `{ name: 'filter', type: 'array' }` in its designer inputs, and `ElementDataSourceGate`
writes the array arm mechanically: binding a pivot the way the spec documents
(`dataSource: { object, view }`) sets `schema.filter` to `mergeFilterNodes(schema.filter,
view.filter)`, an ObjectQL AST node, for every saved view that carries a filter. So the pre-fix
drill dropped the scope of every view-bound pivot, not just of a pivot whose author happened to
pick the array spelling.

**The fix.** `composeDrillFilter` (`@object-ui/core`, added by objectui#8944) already names and
applies the rule — `widget.filter` conjoined with `drill.filter`, via the repo's single filter
sink `mergeFilterNodes` — and lowers the result back to the object dialect both of this widget's
drill sinks take. Routing this site through it replaces the local spread with the shared answer
rather than deriving a second one.

**Compatibility.** The drilled ROW SET is unchanged wherever it was already correct, which is the
oracle this change is measured by. The composed VALUE can change shape: a pivot cell click derives
two conditions (row field and column field), which are themselves a conjunction, so a pivot with no
filter of its own now drills by `{ $and: [{ stage: 'won' }, { source: 'web' }] }` where the spread
produced one flat object. Every sink accepts both — `$filter` takes `$and`, and
`serializeDrillFilterParams` flattens nested `$and` into the same `filter[...]` params it always
wrote (pinned since objectui#8944). When neither source carries anything the seam now answers
`undefined` rather than `{}`; `DrillDownDrawer.filter` is optional, so the drilled list is unscoped
either way.
