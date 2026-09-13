---
'@object-ui/types': minor
---

Narrow 62 component schemas whose renderer reads NEITHER content channel: both `body`
and `children` are now refused by name on both published faces (objectui#9256, family D
of the objectui#8284 measured table).

**BREAKING, deliberately.** A `body` or `children` authored on any of these node types
is now a `tsc` error at the authoring site and an `invalid_type` refusal at the key's
own path on the zod mirror. Nothing that RENDERED stops rendering: the measurement is
that no renderer read consumes either key for these types, so an authored value drew an
empty element before this change and draws the same empty element after it — it is
merely refused first, instead of silently dropped. `minor` rather than `major` because
this repo's version policy forbids `major` in any changeset (41 packages in one `fixed`
group), and records `minor` plus an explicit breaking note as the spelling for a
breaking change here.

Executes the maintainer ruling recorded on objectui#8284 (summon #17, decision batch #2,
2026-09-07, verbatim 「同意」): every component schema narrows to the channel its renderer
actually reads and tombstones the other. PR objectui#9254 landed families A and B (the
components that read exactly one channel); this is family D, the components that read
neither.

The verdict is a claim of ABSENCE, so it was measured with the TypeScript type checker
across **46 programs** — every workspace package plus the apps and examples, 1,604 source
files — not with grep and not over one package. The extended table is on objectui#9256.
Held out and named there rather than guessed: the nine `type` names carried by two or
more registrations with different declarations, `InputSchema` (an `Omit` of it is the
shorthand face, whose registrations are `any`-typed), `AppComponentSchema` and
`DetailViewSchema` (their own type literals are served by other registrations), and the
`body` key of the three chatbot faces (the parity ledger records it as a naming
collision awaiting a ruling — their `children` is narrowed).

Four published documents in the schema catalog and three component reference pages were
authoring `children` on `dialog`, `drawer`, `popover` and `collapsible`, all of which
read `content`. They rendered empty boxes and are corrected here.
