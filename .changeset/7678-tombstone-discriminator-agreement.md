---
---

Comment-only agreement fix in `@object-ui/types`. The retire-vs-remove discriminator was
stated at three sites in `complex.ts` at two different levels of amendment: the
`KanbanColumn.color` block and the `ChatbotSchema` dark-keys block gave the two prongs
without their precondition, while the `displayMode` tombstone already carried it. Both of
the first two now state the amended rule (objectui#7678) in the wording the third already
uses — a `?: never` tombstone is available only on a surviving carrier, and on one it is
used when either prong holds; a whole exported type name has no carrier and is removed
outright — so a reader landing on any of the three gets the same rule. The
`KanbanColumn.color` site's own parenthetical had named this card as its open correction;
that parenthetical is now discharged rather than repeated.

The `triggerIcon` tombstone's own rationale was the site objectui#7678 was filed about, and
it still argued from `tsc` behaviour alone — a contrast that applied equally to the two
precedent retirements that were removed outright, so it cannot be what separates the routes.
It now carries the amended discriminator and names prong 2 (the 3.3.0 release record
advertised the key, and its published JSDoc promised a default) as the reason this key earns
a tombstone, with prong 1 recorded as not holding. The route itself is unchanged.

`mobile.ts`'s `MobileOverrides` retirement note keeps its prong-1 argument, which is
settled, and gains a pointer to the amended rule and to the reason prong 2 has nothing to
guard there: this module has never had a `zod/` twin, so there is no mirror that could
accept an undeclared key and strip it silently.

The `objectui#6152` tripwire comment in `floating-chatbot-trigger-icon-retired.test.ts`
claimed the parse-green assertion it sits on would go red once a `FloatingChatbotConfigSchema`
is minted. Measured by injecting the arm on both twins and restoring under a trap: a
house-style non-strict `z.object` mirror reds the shape pin only (2 failures, one per twin)
and leaves that parse-green line green, while a `z.strictObject` mirror reds both (4
failures). The comment now names the shape pin as the assertion that fires and records both
readings; the shape pin gained a back-pointer.

`Clause-②: no` — no member added, removed, renamed or retyped, no accept set moved, and
nothing newly exported. The prose does reach the emitted `.d.ts` (this repo builds with
`removeComments: false`), but nothing a consumer can execute or type-check against changes,
so this releases nothing.
