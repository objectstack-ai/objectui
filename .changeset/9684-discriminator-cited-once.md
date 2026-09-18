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

`mobile.ts` now **cites** the rule instead of restating it: the one statement
lives on `ChatbotSchema` in `complex.ts`, and each of the four retirement notes
in `mobile.ts` points at it while keeping its own per-retirement argument —
which prong holds here and why — unchanged. Nothing is deleted into a vacuum:
every prong measurement, every reopen condition and every `@objectstack/spec`
history note is kept verbatim.

**What a `.d.ts` consumer's reading changes to: nothing.** All 65 emitted
declaration files are byte-for-byte identical to the ones this branch's base
emits — measured twice on full rebuilds (`pnpm --filter @object-ui/types clean
&& pnpm --filter @object-ui/types build`, hashing `dist/**/*.d.ts`), never on an
incremental one. The instrument was shown able to fail in the same pass: a
marker injected into a `//` note in `mobile.ts` reaches `dist/mobile.d.ts` zero
times, while the same marker injected into JSDoc on `ChatbotSchema` reaches
`dist/complex.d.ts` once. That asymmetry is the reason only `mobile.ts` was
converted: its notes are `//` comments at module scope, which declaration emit
does not carry, so a citation costs a consumer of the published declarations
nothing there. `complex.ts` still states the rule in full, because converting it
would cost a declarations reader a jump out of the block they are in — a trade
left to the maintainer rather than taken here.

The agreement is now pinned rather than remembered:
`packages/types/src/__tests__/tombstone-discriminator-agreement-9684.test.ts`
derives the population of rule statements from the source at run time and fails
when one of them omits the surviving-carrier precondition, when `mobile.ts`
restates the prongs again, or when the cited statement stops being where the
citations say it is. Its detector carries its own controls, including a vacuity
control that reds if the markers stop matching instead of passing on an empty
set.
