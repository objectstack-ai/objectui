---
'@object-ui/core': minor
'@object-ui/plugin-grid': patch
'@object-ui/types': patch
---

`object-grid` normalizes its `sort` before joining it into `$orderby` (objectui#8973).

**The defect.** `ObjectGrid` lowers `schema.sort` with private code rather than the
shared sink, and its array arm interpolated every key unconditionally:

```js
params.$orderby = schemaSort.map((s) => `${s.field} ${s.order}`).join(', ');
```

So an entry missing `field` or `order` reached the wire as the literal text
`undefined`. The legacy `defaultSort` arm one `else` down had the identical defect on a
single object, and is fixed with it — leaving it would keep the class open inside the
same `if`/`else` chain.

This is a wire failure, not a cosmetic one. `normalizeSortNodes` — the one normalizer
every `@objectstack` server ingress funnels through — validates the direction token, so
`$orderby: 'name undefined'` is answered `400 INVALID_QUERY`, while `'undefined desc'`
becomes a well-formed sort on a column literally named `undefined`.

**What changes on the wire.** Only inputs that were already broken:

| authored `sort` | before | after |
| --- | --- | --- |
| `[{ field: 'name', order: 'desc' }]` | `"name desc"` | `"name desc"` (unchanged) |
| `[{ field: 'name' }]` | `"name undefined"` | `"name asc"` |
| `[{ field: 'name', order: 'desc' }, { field: 'status' }]` | `"name desc, status undefined"` | `"name desc, status asc"` |
| `[]` | `""` | key omitted |
| `['name desc']` | `"undefined undefined"` | key omitted |
| `[{ order: 'desc' }]` | `"undefined desc"` | key omitted |

**The wire SHAPE does not move.** The `"field order"` join string stays. Routing this
arm through `convertSortToQueryParams` would send that sink's `{field: direction}` map
instead — route B on objectui#8767, which the maintainer declined by name on 2026-09-10
pending a card that measures the server contract and both readers.

**New in `@object-ui/core`:** `normalizeSortEntries` (and its `NormalizedSortEntry`
type) — the "which entries survive, and what does a missing `order` mean" decision,
lifted out of `convertSortToQueryParams`, which is now a map projection of it. This is
what lets a block sending a different wire shape share the one implementation of the
rule instead of keeping a private copy that drifts. `convertSortToQueryParams`'s own
behaviour is unchanged and pinned against literals captured from the previous
implementation.

**Two false docblock sentences corrected** (`@object-ui/types`' `ObjectGridSchema.sort`
and this sink's own header). Both read "`order` is optional and means `'asc'`" — the
first sitting two lines above a declaration that requires it. `SortConfig.order` is
required on the interface, on the zod mirror, and on `@objectstack/spec`'s
`SortItemSchema`, which refuses an entry without it. An author following that
prescription wrote metadata the spec rejects. objectui#8767's contract review routed
both sentences to this card by name; comments only, no behaviour.
