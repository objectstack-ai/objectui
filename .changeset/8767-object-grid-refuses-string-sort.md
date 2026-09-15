---
'@object-ui/plugin-grid': minor
---

`object-grid` REFUSES the retired string `sort` clause at its own read site
(objectui#8767, maintainer ruling 2026-09-10 — route C).

**Breaking, deliberately.** A `sort: "name desc"` on an `object-grid` node no
longer reaches `$orderby`. It is reported once per spelling with the diagnostic
objectui#8221 / PR #8758 already ship — the message names the offending value
and prescribes the array form — and the query goes out carrying no ordering at
all, exactly as the same key already behaves on `object-view`.

**Why it was still lowering.** The #8221 ruling retired the legacy string
clause: one spelling, the array, everywhere. PR #8758 narrowed the shared sink
`convertSortToQueryParams` and every declaration that published a string arm,
but `ObjectGrid` never used that sink — it reads `schema.sort` and lowers it
with private code, so a bare grid went on honouring at runtime a spelling
`object-view` refuses. One key, two meanings, chosen by which block you are on
— which is the per-block divergence the ruling declined by name when it
rejected option A.

**Migration.** Write the array: `sort: [{ field: 'name', order: 'desc' }]`.
**Both keys are required.** `SortConfig.order` carries no `?` in
`@object-ui/types` (`packages/types/src/objectql.ts`) and no `.optional()` in
its zod mirror, and the protocol's own reusable `SortItemSchema` requires
`order` as well — measured: that schema refuses `[{ field: 'name' }]` with
`invalid_value` at `0.order`. Do not omit it: this block's array arm
interpolates whatever is present, so an omitted `order` lowers to
`$orderby: 'name undefined'` today. That is pre-existing behaviour on the arm
this change does not touch, and it is filed as a successor card rather than
widened into here.

**What the spec face does and does not say.** Measured against the installed
`@objectstack/spec@17.4.0`: `ui.ObjectGridPropsSchema` is **value-agnostic** on
this key — `sort` is `z.unknown().optional()`, so `safeParse` accepts
`'name desc'`, `'name'`, `42`, `['name desc']` and `{ name: 'desc' }` alike,
while an undeclared `bogusProp` is refused with `unrecognized_keys` (the
control that shows those parse readings are real and not a schema that accepts
everything). So the protocol's **validator** does not refuse the string, and
this change is not a narrowing the validator already performed.

What the protocol **declares and documents** is the array, in three places:
that same key's own `describe` reads `Initial sort (array of { field, order })`;
the sibling `ElementRecordPickerPropsSchema.sort` spells the identical intent as
a typed `z.array(SortItemSchema)`, which refuses a string outright; and the
`defaultSort` retirement text instructs authors to rename the key to `sort` and
`wrap the value in an array`. The array is likewise the only spelling
`ObjectGridSchema.sort` has declared since #8221, the only one the registered
`sort` input publishes (`type: 'array'`), and the only one
`convertSortToQueryParams` lowers. So type-checked metadata is already on it,
and only untyped JSON or a stored `sys_metadata` row can still carry the string
— which is exactly why the refusal is a loud runtime diagnostic rather than a
type change.

**What is deliberately unchanged.** The wire shape. The array arm still lowers
to this block's own `"field order[, field order]"` join string, and the export
path and the header-arrow reader `parseSchemaSort` still read the key exactly as
before. Routing the whole key through the shared sink would send its
`{ field: direction }` map where every grid today sends a string; that is a
separate change with its own blast radius, and this ruling explicitly did not
take it.
