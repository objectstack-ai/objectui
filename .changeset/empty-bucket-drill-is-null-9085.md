---
'@object-ui/core': minor
---

fix(core): an empty-bucket drill filters on "this dimension is empty" instead of writing a spelling the converter drops

`buildDatasetDrillFilter` wrote a bare `null` for a bucket whose dimension value
is empty. `convertFiltersToAST` SKIPS a key whose value is `null` / `undefined`
— its oldest pinned behaviour — so the constraint never reached the wire and
drilling into the empty bucket answered with a SUPERSET: every row, silently,
with nothing thrown and nothing logged. Measured on three shapes (two drill
dimensions with one empty; one drill dimension plus a runtime filter; one drill
dimension with no runtime filter), all three were wrong.

The empty bucket now lowers to `{ [field]: { $null: true } }`, which the
converter carries end to end as `[field, 'is_null', true]`. That spelling means
"this dimension has no value" — the rows the aggregate actually counted into
the bucket — where an equality test against `null` would have meant "this
dimension holds the literal value null" and dropped every row whose field is
absent. All three empty authorings (`''`, `null`, `undefined`) reach the one
spelling; `null` is included because JSON cannot carry `undefined`, so a SQL
NULL grouped value arrives over the wire as `null`.

BREAKING for a direct consumer of the exported `buildDatasetDrillFilter`: the
value written for an empty bucket changes shape. Marked `minor` per this repo's
version-alignment rule, which reserves `major` for following `@objectstack`.

The drill "escape hatch" (the host's `openRecordList`, which serializes a drill
filter into `filter[...]` URL params) is unchanged and still returns a superset
for the empty bucket: that URL dialect has no is-null operator, so it drops the
new spelling exactly as it dropped the bare `null`, byte for byte. Closing that
needs a URL-dialect operator on both the write and the read side.
