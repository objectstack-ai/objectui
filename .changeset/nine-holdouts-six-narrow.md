---
'@object-ui/types': minor
---

**BREAKING (shipped as `minor` — see below):** six component schemas now refuse
both content channels by name. `text`, `image`, `icon`, `tabs`, `accordion` and
`calendar` (and `ui:calendar`, which inherits the narrowing by declaration) read
NEITHER `body` nor `children`, so both keys become `?: never` on the TypeScript
face and a by-name `retirementTombstone` refusal on the zod mirror — kept a
MEMBER of the mirror shape, so the parity ratchet's key sets stay equal.

A key that parsed GREEN through `BaseSchema.passthrough()` and rendered NOTHING
is now refused at its own path, at authoring time and at `safeParse` time. No
render behaviour changes: nothing read these keys, which is the whole reason
they could be refused.

These six were HELD OUT of the earlier family-D slice because
`ComponentRegistry.register` writes the bare-name fallback last-one-wins and
which declaration governed a bare node was unmeasured. It is measured now —
`check:registry-bare-names` reports one owner per name — so each narrowing rests
on a measured owner rather than on import order. `button` was in the dispatched
set and is deliberately NOT here: its measured owner reads
`schema.body || schema.children` live, which makes it family C and a behaviour
change, not a declaration repair.

`minor` rather than `major` because this repo's version policy forbids `major`
in any changeset — one `fixed` group — and records `minor` plus an explicit
breaking note as the spelling for a breaking change here.
