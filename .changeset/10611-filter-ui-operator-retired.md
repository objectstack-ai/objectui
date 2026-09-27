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
from `type` and emits `{ values }` only (to a host `onChange` function and to
the authored window event), a field → value record with no operator in it, and
it does no matching of its own. Yet both published faces declared the key (the
mirror as a seven-member enum) and the docs page taught it, so
`operator: 'gt'`, or a nonsense id, type-checked, parsed green through
`objectui validate`, and changed nothing the component rendered or emitted.

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
