---
'@object-ui/types': patch
---

Retire the objectui#8344 `superRefine` clause on the node recursion point, and re-point the
two test legs that had become readings of an inert thing (objectui#9659, carrying
non-blocking residuals a contract review named on objectui#9639).

**What was there.** `defineNodeComponentUnion` (`zod/base.zod.ts`) installed the component
union into the node slot WRAPPED in a `superRefine` clause that re-issued the node-slot's own
refusal under `body` for a `chatbot` node. #8344 needed it because `ChatbotSchema.body` was
then a record — the one redeclaration across the arms that was WIDER than the base key it
restated — so installing the union bare would have narrowed at 108 child slots and widened at
one.

**Why it is gone, measured rather than argued.** Ruling A on objectui#8572 made
`ChatbotSchema.body` an ADR-0049 retirement tombstone on both published faces, and
objectui#9639 landed it. The clause could then no longer FIRE, which is a stronger statement
than "no longer matter":

- zod skips a check once the schema it wraps has refused, and the arm refuses every DEFINED
  `body` — measured over record / node / node array / string / number / boolean / null /
  empty array / empty record, all REFUSED — while the clause's own first line returns early
  on `undefined`. The two conditions "reaches the clause" and "has a `body` to check" are
  disjoint, with no input in between.
- read off the issue tree of a nested refusal: the arm's tombstone at the child's own `body`
  path and NO clause-shaped issue. LIT CONTROL, same probe, same document, with the
  pre-objectui#9639 record arm rebuilt in place: the clause's issue appears there and the
  tombstone does not. That control is what makes the zero a reading instead of a broken
  instrument.

**The accept set does not move, and that is measured too.** 432 schema-catalog documents
through `safeValidateSchema`, plus a 60-case sweep of the three chatbot faces x ten `body`
shapes x both depths: byte-identical verdict list before and after. A clause that cannot fire
cannot be narrowing anything.

**The wrapper's OTHER role is kept, not dropped.** The read-back assertion that announces a
zod which stopped keeping its option array by reference is untouched, and
`node-recursion-point-8344.test.ts`'s `fill is LIVE` leg is re-pointed from the wrapper's
SHAPE — `not.toBe` the bare union, plus `checks` of length exactly 1 — to the INSTALLATION:
slot 0 holds the component union and not the pre-#8344 base shape. That pin still fails on
the failure it exists for; an unfilled holder answers a different object.

**A second leg was vacuous and is repaired.** `names body in the refusal` read
`JSON.stringify(issues)` for the substring `"body"`, which the PARENT card slot supplies for
any refused child. Measured: three documents with nothing wrong at `body` — a nested off-spec
`icon`, a nested unmirrored `metric-card`, a nested `chatbot` missing `messages` — all
satisfy the old assertion, and none carries an issue at the child's own `body` path. The leg
now reads that path, asserts the remedy reaches the author at DEPTH and not only at the root,
and the three controls are pinned alongside it so the discrimination is tested rather than
described.

**`patch` rather than empty frontmatter, and the grade is measured.** `packages/types`
publishes `dist`, and this change moves published bytes: the clause leaves the shipped bundle
(`dist/zod/index.zod.js` 515,520 to 516,078 bytes; `dist/zod/base.zod.js` 43,462 to 44,370),
and the declaration emit moves with it. Positive control: neighbouring shipped content is
present in both builds and two builds of the same source are byte-identical, so the delta is
this change and not build noise. ⛔ An empty frontmatter here would have been a claim that
nothing published moved, and it would have been false.

**Prose amended where this change falsified it, ⛔ not rewritten.** `zod/index.zod.ts` said
`defineNodeComponentUnion` "wraps it rather than replacing it" — true only while a wrapper
existed. `zod/base.zod.ts`'s note on the loose parameter bound still names `ChatbotSchema`'s
record `body` in the present tense; the paragraph is kept for the reason it records and
carries an AMENDED note saying the exclusion set that pin reads is now empty.

**One reading in a neighbouring table got a line, not a rewrite.** In
`content-channel-family-d-9256.test.ts` the plain `chatbot` row lists `children` only, which
on the two TWIN faces still means "`body` held out and live" — and objectui#9639 had to
re-point that table's LIVE CONTROL at a twin precisely because the plain face refuses `body`
now, for objectui#8572's reason rather than this table's. Measured: `body` ACCEPTED on
`chatbot-enhanced` and `chatbot-floating`, REFUSED on `chatbot`. The row is annotated as
one-sided so the next reader does not take it for a two-sided reading. ⛔ No assertion in that
table moved.
