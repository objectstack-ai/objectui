---
'@object-ui/types': minor
---

feat(types)!: `FilterUISchema.filters[].operator` is retired on the `filter-ui` node and refused by name

⚠️ Breaking, marked `minor` under this repo's version-alignment rule (a `major`
in the fixed group would move all of it off the `@objectstack` major). A
`filter-ui` node whose `filters[]` entry authors `operator` now FAILS to
validate, and a TypeScript literal typed as `FilterUISchema` that sets it no
longer compiles.

`filter-ui` never read a per-filter operator. Its renderer picks each control
from `type` and reports a change as a field → value record with no operator in
it: a host `onChange` function receives that bare record, and only the authored
window event wraps it, as `detail: { values }`. It does no matching of its own.
Yet both published faces declared the key (the mirror as a seven-member enum,
the TypeScript face as the same union) and the docs page taught it. So
`operator: 'gt'`, a member of that enum, type-checked and parsed green through
`objectui validate`; a nonsense id was refused by the enum and did not
type-check; and both rendered and emitted exactly what a filter without it
does.

The member is now a `?: never` tombstone on the TypeScript face and a
`retirementTombstone()` on the zod mirror (ADR-0049). The `filters[]` entry is
a plain object schema that strips an undeclared key, so deleting the
declaration would have dropped an authored value in silence rather than refused
it. The refusal is an `invalid_type` issue at the entry's own path
(`filters.N.operator`). No replacement key is named, because nothing in this
component implements operators: remove the key. How each value is matched is up
to the host that consumes the change.

The `filter-ui` docs page no longer lists `operator` in its Schema block and
states the retirement. A one-time census, recorded on the card's pull request
and not re-derived here, found no producer that writes the key and no reader
that honours it.

Pinned in `packages/types/src/__tests__/filter-ui-operator-retired-10611.test.ts`.
