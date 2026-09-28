---
---

Corrective, comment-and-figures only: no published behaviour changes, so this
declares no bump.

`NamedListView`'s member figures were quoted wrong in four places. The
declaration has **47** top-level members, counted with the
`namedListViewMemberCount()` regex that
`packages/types/src/__tests__/object-view-unmirrored-keys-7779.test.ts` uses for
its own assertion — not "about 52", which was a hand figure sitting between two
instruments (a looser count that also matches nested object-literal lines gives
59 on the same declaration). The derived "unread" figure is **41**, not 45: the
renderer reads seven keys off a named view, but only six of them (`label`,
`type`, `columns`, `filter`, `sort`, `options`) are declared members. The
seventh, `data`, is not declared on `NamedListView` at all — it reaches the
renderer through an `as any` cast on the named-view config in
`packages/plugin-view/src/ObjectView.tsx` — so the arithmetic is 47 − 6, not
52 − 7.

Corrected at all four sites: this changeset's sibling
`.changeset/object-view-unmirrored-keys-7779.md` (still unconsumed, corrected in
place so the wrong figure never reaches a published CHANGELOG), the
`ObjectViewSchema` docblock in `packages/types/src/zod/objectql.zod.ts`, the
`UnmirroredDeclared` note in
`packages/types/src/__tests__/zod-mirror-parity.test.ts`, and the header of the
pin test file.

The pin that should have caught the drift did not bind: it asserted
`toBeGreaterThanOrEqual(40)` against a true 47, which permitted the declaration
to shed seven members — including a shrink toward the read set, the exact
condition that re-opens the `listViews` value-type decision — and could not
catch growth at all. It is now an exact `toBe(47)` whose failure message names
the three sibling files whose figures must move with it, plus a comment
recording how the count is taken and where the retired "about 52" came from.

⚠️ **Dated note, 2026-09-28 — the declaration has 64 members, 43 of them read
off a named view — objectui#8980, objectui#7928 and objectui#10758.** Later in
this same release three changes moved every figure above. objectui#8980
declared the seventeen members the protocol declares on a named view, `data`
among them, and removed the `as any` cast. objectui#7928 stopped reading a
named view's `options` bag, which the protocol's record refuses. objectui#10758
made the host delegation read the twenty-three protocol members of bucket ① of
the objectui#7924 ruling off the named view first. So "The declaration has
**47** top-level members", "gives 59 on the same declaration", "The derived
"unread" figure is **41**", "the renderer reads seven keys off a named view, but
only six of them … are declared members", "The seventh, `data`, is not declared
on `NamedListView` at all", "the arithmetic is 47 − 6" and "It is now an exact
`toBe(47)`" above no longer hold. At this note's date the TypeScript parser and
the strict regex both count 64 declared members and the loose regex counts 76;
the renderer reads 43 of them off a named view, every one declared, and
`options` is not among them; the arithmetic is 64 − 43 = 21 unread; and the pin
is an exact `toBe(64)`. `object-view-unmirrored-keys-7779.test.ts` re-derives
these figures on every run.
`.changeset/named-list-view-protocol-members-8980.md` (PR objectui#9534),
`.changeset/7928-listviews-by-reference-fold.md` (PR objectui#10821) and
`.changeset/10758-named-view-protocol-members.md` (PR objectui#10884) state what
ships; the text above is kept as the reading of this change.

No schema, no type, and no assertion about what is accepted or refused changed.
