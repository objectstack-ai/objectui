---
'@object-ui/core': minor
---

Conjoin the widget filter into a dataset drill instead of SPREADING it
(objectui#9137) — the third and last site of the mis-composition objectui#8944
removed from `ObjectChart` and objectui#9024 removed from `ObjectPivotTable`.

`buildDatasetDrillFilter` ended in `{ ...runtimeFilter, ...drillFilter }`.
Spreading is correct only for the object-dialect arm, and this site's declared
producer sends the other one: `DashboardWidgetSchema.filter` says so in as many
words — "objectui passes an ObjectQL FilterNode array here, not the spec's
`FilterCondition` envelope" — and `DatasetWidget`'s guard admits an array
(`typeof [] === 'object'` is true and `Object.keys(['x']).length` is 1). So the
arm the type's own docblock names as the one objectui sends reached the spread,
where `[['region','=','emea']]` became the index key `{ '0': [...] }`.

**Breaking, deliberately** — the level is `minor` because every package in this
repo sits in one `fixed` group and `major` would drag the whole group off the
`@objectstack` major it tracks. What changes for a caller: when a widget filter
IS present, the composed drill filter is now `{ $and: [<widget>, <drill>] }`
rather than one flat object, and a field named by BOTH sources now applies both
conditions instead of letting the clicked bucket overwrite the widget's. That is
the repair — a drill may narrow the widget's scope and may never widen it. The
result is produced by `composeDrillFilter`, the seam objectui#8944 added, which
routes both arms through this repo's single filter confluence `mergeFilterNodes`
and lowers the answer back to the object dialect; no local composition is
derived here. The `runtimeFilter` parameter widens from
`Record<string, unknown>` to `unknown` so the arm the declaration names is
admitted without a cast — a widening, so no call site has to change, and
neither consumer's own type was touched.

**Unchanged on purpose.** With no widget filter there is nothing to conjoin, so
that leg still returns the drill filter verbatim, byte for byte. Routing it
through the sink anyway was measured and rejected: a lone source of two or more
conditions also lowers to `$and`, which would have re-shaped every
multi-condition dataset drill — including paths pinned by objectui#9085,
objectui#4056, objectstack#5473 and #1752 — for no change in the rows selected
or the `filter[...]` params emitted.

**The failure direction, corrected by measurement.** This was filed and graded
as a silent fail-OPEN superset, on the premise that an index key is one "nothing
reads as a condition". It is not: a bare array is not a legal equality comparand
in this dialect (objectui#8530 / objectui#8514), so `convertFiltersToAST`
THROWS, the in-memory matcher selects nothing, and `driver-sql` answers
`400 INVALID_FILTER`. The drilled list was dead, not wide. Pinned as row sets in
`dataset-drill-array-arm-9137.test.ts`.
