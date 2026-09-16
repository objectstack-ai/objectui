---
'@object-ui/types': minor
---

**BREAKING (shipped as `minor` — see below):** `list` and `timeline` now refuse
both content channels by name. Neither renderer reads `body` or `children`, so
both keys become `?: never` on the TypeScript face and a by-name
`retirementTombstone` refusal on the zod mirror — each kept a MEMBER of the
mirror shape, so the parity ratchet's key sets stay equal.

A key that parsed GREEN through `BaseSchema.passthrough()` and rendered NOTHING
is now refused at its own path, at authoring time and at `safeParse` time. No
render behaviour changes: nothing read these keys, which is the whole reason
they could be refused.

⭐ The ITEM channel of `list` is a DIFFERENT key and is untouched. Its renderer
draws each entry as `item.content || renderChildren(item.body)` — a read filed
under `ListItem`, not under `ListSchema`. `items[].content` stays authorable and
is pinned as a live control; only the node's own two keys move.

These two were held out of the previous family-D slice for a SERIAL constraint
on `packages/types/src/data-display.ts` and never for a verdict. Readership was
re-derived for both rather than inherited: a TypeScript compiler-API sweep files
every `.body` / `.children` read under the declared type of its receiver and
answers zero for `ListSchema` and `TimelineSchema` while its live controls fire.
`timeline`'s bare-key owner is `any`-typed, so it was attributed directly as
well — `packages/plugin-timeline` contains no channel read of any kind.

`minor` rather than `major` because this repo's version policy forbids `major`
in any changeset — one `fixed` group — and records `minor` plus an explicit
breaking note as the spelling for a breaking change here.
