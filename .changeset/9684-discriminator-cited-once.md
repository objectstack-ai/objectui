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
one of the two paraphrases the rule past every phrase it searched for. Neither
carries the rule any more: like the other two notes in that file they now cite
it, so the population this amendment would have had to move through is the four
that survive in `complex.ts`.

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
when one of them omits the precondition **in the rule's own phrasing**, when any
file in the package outside `complex.ts` states the rule at all, when the cited
statement stops being where the citations say it is, when `complex.ts` states the
rule at any number of sites other than the recorded four, or when one of those
four carries a clause its peers do not. Its population is every comment in the
package, a `//` riding on a code line included — and a comment run ends at a
blank line, at a `*/` and at a change of comment kind, so two abutting comments
are two blocks rather than one.

⭐ Each of those is narrower or wider than it was, and each because a wording was
measured through the earlier version rather than reasoned about. The precondition
was matched anywhere in the block, so an un-amended statement passed when its
argument happened to say "there is no carrier" while the same defect worded "no
surviving object" was caught — the same defect deciding on the author's choice of
words. `mobile.ts` was held only to "does not write the prongs out", so a note
restating the precondition passed. The site count was `>= 4`, so a fifth
statement passed and the "four sites" this changeset states was re-derived by
nothing. The scope was `mobile.ts` alone and the population was runs of
comment-only lines, so a fully amended statement prepended to `data-display.ts`
passed and so did one appended to an `export interface` line — a fifth statement
off the roster, held to its precondition alone and free to drift at the next
amendment, which is this card's mechanism one file over. And a blank line was
the only boundary between comment blocks, so an un-amended note glued directly
under a compliant JSDoc — or stacked directly above it — was read as part of
that JSDoc, inherited its precondition and its roster slot, and passed while a
human reading the file counted five statements. The control that makes that a
reading rather than a blind spot: the same note with a blank line between it and
its neighbour reds four assertions. The boundary now ends a run at a `*/` and at
a change of kind too, which re-cuts 29 abutting pairs across the package
(4696 blocks → 4725) and moves no count this changeset or that test states — the
four statements keep the same four line spans and the trailing count stays 9.

⚠️ What is still silent, given as the patterns and ⛔ not as a summary of them: a
third prong is caught when it is written `prong 3`, `third prong`, `(3)`, or as
`or` followed by `3`, `iii`, `third` or `thirdly`. The `or` in that last item is
an **anchor** — `3`, `iii`, `third` and `thirdly` are caught only directly behind
`or`, with nothing in between but commas, whitespace and opening parentheses,
any number of them in any order. So `, or ( 3 ) …`, `, or ,3 …`, `, or, (iii) …`
and `, or (( 3 )) …` are each caught, while `, and (iii) …`, `, or else (iii) …`,
`; and, third, …` and `, or: (iii) …` are each silent. The other three spellings
carry no anchor: `prong 3`, `third prong` and a parenthesised `(3)` are caught
however the clause is joined, `, and (3) …` included. Silent as well: a clause
that numbers nothing, and a whole statement worded past every statement marker.

⛔ Four earlier versions of this paragraph summarised that boundary and were
wrong every time — first "`(3) it`" excluded `(3) the`; then "numbers nothing"
excluded `(iii)`, `3.` and `thirdly`; then "any other numbering **and** when it
numbers nothing" put a listed numbering joined by anything but `or` in neither
category; then the permitted characters were named as a **set** while the
pattern spelled them `,?\s*\(?` and required them in one **order**, so
`, or ( 3 ) …` and `, or ,3 …` broke no sentence anyone had published and were
silent anyway. Each was measured passing. ⭐ The fourth is the only one closed
by moving the **pattern** instead of the sentence: the separator is now the set
`[\s,(]*`, a strict superset of the old one, so no wording that was caught
became silent and the caught-list above is re-derived from the widened pattern
rather than patched. The failure direction of every widening above is a red that
sends a human to read four blocks, never a green.

The pin also holds itself to the rule it guards: it cites the statement instead
of quoting it, and asserts that it contains no quotation — because the header
did quote it, and said in the same sentence that it did not, while tests sit
outside the population the pin enumerates.
