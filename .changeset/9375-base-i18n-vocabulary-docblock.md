---
'@object-ui/types': patch
---

Correct the i18n vocabulary prose in `BaseSchema` — the two label shapes do NOT
accept each other, and an instrument in the tree re-derives that (objectui#9375).

`base.ts` said of the INLINE locale map (`label` / `description`) and the KEYED
bundle reference (`ariaLabel`) that they "each accept the other's shape
vacuously", and the `label` docblock said the same thing one property over
("a keyed ref typed into this slot is accepted only *vacuously*"). That was true
when objectui#4580 Q2-B wrote it; the installed pin has since closed it, and the
sentence now reads as live in published `.d.ts` bytes while the tree says the
opposite.

**Measured, both crossings and both faces, on `BaseSchema` itself.** A keyed ref
in `label` / `description` and an inline map in `ariaLabel` are each refused at
`tsc` (TS2322) and at `safeParse` on the zod mirror; each shape in its own slot
compiles and parses, which is the control that keeps the refusals from being a
slot that refuses every object. The refusal's mechanism is the pin's inline arm,
typed `key?: never; defaultValue?: never`, whose `INLINE_LOCALE_KEY` pattern
excludes both names.

**What the docblock now says instead** is what a wrong slot actually costs — a
WRONG ANSWER, not a silent acceptance, paid by metadata that reaches a resolver
without passing either face: `resolveI18nLabel` hands a keyed ref back as its own
`key` string (so the key renders), and `resolveKeyedI18nLabel` answers `undefined`
for an inline map (so the aria-label renders empty). Both measured on the
installed pin. The live claim points at the cross-vocabulary block of
`packages/types/src/__tests__/inline-locale-declared-face-9092.test.ts`, which
re-derives it on every run, rather than restating the answer (AGENTS.md #9).

⛔ No declaration, accept set or requiredness moves — the diff is comment-only,
and objectui#9092 keeps `BaseSchema` read-only. It is graded `patch` rather than
a no-release changeset because the published bytes move: the corrected prose ships
in `dist/base.d.ts`, where the old sentence was telling every reader — human and
AI — the opposite of what the type and the parser do.
