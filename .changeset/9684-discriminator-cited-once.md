---
---

Comment-only change in `@object-ui/types`, plus one new pin test. **Nothing
publishes.** The retire-vs-remove discriminator — a `?: never` tombstone is
available only on a surviving carrier, and on such a carrier it is used when
either prong holds — was written out in full at eight sites across `complex.ts`
and `mobile.ts`, so objectui#7678's amendment had to be applied by hand at every
one of them and a missed site went red nowhere.

Two sites still carried the un-amended rule on this branch's base: the
`MobileResponsiveConfig` retirement note and the `MobileComponentConfig`
retirement note, both in `mobile.ts`. Neither was named by the finding that
asked for this change — its probe was a literal-phrase grep over two files, and
one of the two paraphrases the rule past every phrase it searched for. Both now
agree with the other six.

`mobile.ts` now **cites** the rule instead of restating it: each of its four
retirement notes points at the statement on `ChatbotSchema` in `complex.ts`
while keeping its own per-retirement argument — which prong holds here and why.
⚠️ That is the statement they cite, not the only one in the package: `complex.ts`
states the rule at four sites, `ChatbotSchema` among three peers, and whether
those four become citations too is an open decision on objectui#9684. Nothing is
deleted into a vacuum: every prong measurement, reopen condition and
`@objectstack/spec` history note survives, the `Prong 1:` / `Prong 2:`
measurement lines verbatim; the `MobileResponsiveConfig`, `MobileOverrides` and
`MobileComponentConfig` arguments are reworded around the citation, with their
substance preserved — the first of those also gains a sentence it did not carry
before, naming the precondition that settles its route.

**What a `.d.ts` consumer's reading changes to: nothing.** All 65 emitted
declaration files are byte-for-byte identical to the ones this branch's base
emits — measured twice on full rebuilds (`pnpm --filter @object-ui/types clean
&& pnpm --filter @object-ui/types build`, hashing `dist/**/*.d.ts`), never on an
incremental one. The instrument was shown able to fail in the same pass: a
marker injected into a `//` note in `mobile.ts` reaches `dist/mobile.d.ts` zero
times, while the same marker injected into JSDoc on `ChatbotSchema` reaches
`dist/complex.d.ts` once. A third control in the same pass fixes the CAUSE: a
`//` comment placed directly above an exported declaration, with no blank line,
also reaches the emitted `.d.ts` zero times ⇒ the dividing line is the comment
FORM, ⛔ not where the comment sits. That asymmetry is the reason only
`mobile.ts` was converted: its notes are `//` comments and not JSDoc, so a
citation costs a consumer of the published declarations nothing there. `complex.ts` still states the rule in full, because converting it
would cost a declarations reader a jump out of the block they are in — a trade
left to the maintainer rather than taken here.

The agreement is now pinned rather than remembered:
`packages/types/src/__tests__/tombstone-discriminator-agreement-9684.test.ts`
derives the population of rule statements from the source at run time and fails
when one of them omits the precondition **in the rule's own phrasing**, when
`mobile.ts` states the rule at all, when the cited statement stops being where
the citations say it is, when `complex.ts` states the rule at any number of
sites other than the recorded four, or when one of those four carries a clause
its peers do not.

⭐ Each of those is narrower or wider than it was, and each because a wording was
measured through the earlier version rather than reasoned about. The precondition
was matched anywhere in the block, so an un-amended statement passed when its
argument happened to say "there is no carrier" while the same defect worded "no
surviving object" was caught — the same defect deciding on the author's choice of
words. `mobile.ts` was held only to "does not write the prongs out", so a note
restating the precondition passed. The site count was `>= 4`, so a fifth
statement passed and the "four sites" this changeset states was re-derived by
nothing. ⚠️ What is still silent, measured and ⛔ not guessed: a clause added at
one site that numbers nothing, and a statement worded past every marker. The test
header names both; the failure direction of every widening above is a red that
sends a human to read four blocks, never a green.
