---
'@object-ui/types': minor
---

Name two of objectui#8499's arms on the `@object-ui/types/zod` barrel, and record the
other two as absent by decision (objectui#9067, director seat, decision batch #121 item 5,
maintainer 2026-09-12).

**Two new exported symbols**, both on `packages/types/src/zod/index.zod.ts`:

- `InputShorthandSchema` (`zod/form.zod.ts`) — the `email` / `password` shorthand arm.
- `UiCalendarSchema` (`zod/form.zod.ts`) — `ui:calendar`, the date-picker primitive
  `renderers/form/calendar.tsx` registers, a different component from the `calendar`
  plugin view that owns the bare literal.

A consumer can now `import { InputShorthandSchema } from '@object-ui/types/zod'` and
validate one of those node types on its own, which `AnyComponentSchema` cannot answer —
it only answers "is this SOME valid node".

**Nothing else moves on the published surface.** Both schemas already existed, were
already maintained and were already applied by the union; only the barrel line is new.
No accept set changes in either direction: a document that parsed green parses green,
and each schema judges the same values it judged before.

**`SemanticElementSchema` and `HtmlElementSchema` are deliberately NOT named**, and this
is the half that has to survive this file. Both are FAMILY schemas keyed by a tag
`z.enum`, so a name bound to either hands a consumer a schema accepting every tag in the
family rather than the one node type every other name on that barrel stands for. That is
the reason objectui#8499 recorded when it armed them and deferred the naming — exporting
the pair "would publish a NAMED authoring surface (`z.enum` families, not per-tag
schemas) that this card's ruling does not cover" — and the ruling upheld it. Splitting
the families into per-tag schemas was ruled out in the same record, as expansion for a
consumer nobody has measured.

⭐ **The reason is now in the tree, not only here.** A `.changeset/*.md` is consumed and
deleted at release (measured: `59f61cfb8` "chore: release packages (#4655)" removes the
batch it versioned), so a reason that lives only in a changeset outlives its own
explanation and leaves a deliberate non-export looking exactly like a dropped line. Both
families therefore carry `ABSENT_BY_DECISION` rows in
`packages/types/src/__tests__/arm-named-export-8784.test.ts`, quoting the sentence above,
and the non-export is written on the barrel beside the `layout.zod.js` block the way
`RetiredKanbanNodeSchema`'s already is. That ledger, not this paragraph, is what is
re-read on every run and what fails when it stops being true.

**On the framing of the card this closes.** objectui#9067 is titled as a recurrence of
objectui#7917 and reads the four omissions as accidental. That is corrected by the
ruling's own record rather than by editing the filer's text: the omission was declared in
objectui#8499's changeset, raised by its ceiling review as a blocking finding, and passed
on the surface-widening reason. No one forgot; a decision was deferred, and this change
is that decision landing.

The recorded instrument habit that would have caught the framing, kept here because it
is the reason the correction was possible at all: before writing "X was omitted", run
`git grep -n X -- .changeset` — deliberate deferrals in this repo are written there,
because that is where a reason is destined for the CHANGELOG.
