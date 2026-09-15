---
'@object-ui/core': minor
---

`ValueDataSource` deep-clones its inline rows with `structuredClone` instead of
`JSON.parse(JSON.stringify(...))` — in the constructor and in `getAll()`
(objectui#9175, maintainer ruling A on objectui#9061).

**Why the round-trip was wrong.** The clone exists for exactly one reason, stated
in the comment above it: "Deep clone to prevent external mutation". That is an
ALIASING barrier on a read-only query source. A JSON round-trip is an aliasing
barrier too, but it is also a SERIALIZATION boundary — and nothing asked for one.
So every row that reached `provider: 'value'` silently acquired a requirement the
contract never states. `ViewData.items` is `z.array(z.unknown())` in
`@objectstack/spec`, not an array of JSON, and objectui#6018 pinned the
consequence in words: an inline value never has to be serializable at all. That
guarantee became false the moment a renderer routed its inline rows through this
adapter to honour `filter` / `sort` / the objectui#7210 row ceiling.

**Behaviour that moves — measured, per shape.** Inline rows now reach the
renderer as authored:

| in `items` | before | now |
| --- | --- | --- |
| `Date` | ISO **string** | a `Date` |
| key whose value is `undefined` | key **deleted** | key kept, value `undefined` |
| `Map` / `Set` | `{}` | a `Map` / a `Set` |
| `RegExp` | `{}` | a `RegExp` |
| `NaN` / `Infinity` | `null` | `NaN` / `Infinity` |
| `BigInt` | **threw** `TypeError` | the `BigInt` |
| cyclic row graph | **threw** `TypeError` | the graph, cycle intact |
| a function-valued key | key **deleted**, silently | **throws** `DataCloneError` |

Two consequences worth naming because they are observable through the adapter's
own API rather than only in the rows: `getObjectSchema` infers types with
`typeof`, so a `Date` column now infers `'object'` where it inferred `'string'`,
and a key whose value is `undefined` now appears in the inferred schema at all;
and `$orderby` on a `Date` column now sorts chronologically rather than
lexically over ISO text (the same order for ISO-8601, a different one for any
other date rendering).

**The last row of that table is the only narrowing, and it is deliberate.** A
function in a row used to vanish without a word; it now fails loudly at
construction. There is no `try`/`catch` fallback to the round-trip, because a
fallback would restore precisely the silent flattening this replaces — the
maintainer's ruling was to fix the clone, not to make it tolerant.

**Migration.** Code that relied on reading a `Date` back as a string (for
example `row.start.slice(0, 10)`, or `===` against an ISO literal) must read it
as a `Date`. Code that relied on an `undefined`-valued key disappearing must test
the value rather than `in` / `hasOwnProperty`. A row carrying a function must
stop doing so — inline rows are data.

Marked `minor` rather than `major` per this repo's version-alignment rule
(objectui's major tracks `@objectstack`'s); the breaking semantics are the table
above.
