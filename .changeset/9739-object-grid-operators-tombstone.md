---
'@object-ui/types': minor
---

Refuse `operators` on `object-grid` by name, and name the correct spelling
(objectui#9739, maintainer ruling 2026-09-18, letter C).

**BREAKING for the misspelling, deliberately.** `ObjectGridSchema`'s published zod
mirror accepted an authored `operators` and handed it back unexamined. It now refuses
it as an ADR-0049 retirement tombstone whose message reads: `` `operators` is not a
key of this component; you meant `operations` ``. A document that spelled `operators`
therefore parses RED where it used to parse green.

Nothing is lost by that break, because the key never did anything. It was a scan
artefact — the line it replaces carried its own provenance in a trailing comment
saying it had been missed by an earlier TypeScript scan — and objectui#9729 measured
it four ways, all zero: no render path reads it (a byte ruler drew the same
`object-grid` document twice, filter surface off and on, with a lit control on a key
the renderer demonstrably does read, and the bytes were identical), no doc or example
in this repo writes it, the block's author vocabulary never listed it, and
`@objectstack/spec` refuses it.

The remedy the message names is the protocol's own, not ours: `@objectstack/spec`'s
`ObjectGridPropsSchema` is a strict object that refuses `operators` and prescribes the
rename in its own words, while the same document spelling `operations` parses green.
That re-derivation runs in the test suite against the installed pin rather than being
copied into a string, so a future upstream rename reddens the pin instead of leaving a
stale instruction in an error message.

**The TypeScript twin is unchanged, on purpose.** `ObjectGridSchema` extends
`BaseSchema`, whose index signature absorbs the key as `any`, and declaring
`operators` there was the option the ruling refused — it would write the misspelling
into the published interface next to the correct spelling, making authors more likely
to reach for it for no behaviour in return. So the published TypeScript accept set is
byte-identical; only the validator narrows, and it narrows toward the protocol.

Authors and generators writing `operators` on an `object-grid` should write
`operations` — the `{ create, read, update, delete }` affordance toggles — or drop the
key, which is what the runtime has effectively been doing all along.
