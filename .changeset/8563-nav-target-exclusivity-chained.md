---
"@object-ui/types": minor
---

`NavigationItemSchema` chains the spec's own `objectNavTargetExclusivity` on the
`type: 'object'` arm, instead of accepting target combinations the platform refuses
(objectui#8563).

This schema is hand-written rather than derived from a spec `.shape`, so nothing carried
the spec's checks across it. An object nav entry declaring both `filters` and `recordId`
— or both `runAction` and `recordId` — parsed clean here and was then refused by
`@objectstack/spec`, i.e. at publish. The drift surfaced only at the most expensive point
to find it, which is the tolerant-consumer shape this repo's contract rule forbids.

The rule is CHAINED, not restated. A local copy of its body passes every case on the day
it is written and starts drifting the day the spec's own rule moves — the same defect one
layer down. `../__tests__/nav-target-exclusivity-8563.test.ts` compares this door's issues
byte for byte against the exported function driven directly, and parses the mirror's source
to refuse a local re-declaration of the name.

**Breaking for authors, and shipped as `minor` deliberately.** The accept set narrows:
documents combining `filters` with `recordId` / `viewName`, or `runAction` with `recordId`,
stop validating here. Anything writing one was authoring metadata the platform already
refused at publish — the same judgement, and the same bump, as the `formats` no longer
admitting `'pdf'` entry in 17.5.0. This repo's fixed release group tracks `@objectstack`'s
major, so objectui's own breaking changes ship as `minor` with the break spelled out here
(AGENTS.md §版本号策略, mechanically enforced by `scripts/check-changeset-no-major.mjs`).

⚠️ The rule is deliberately NOT pairwise-exclusive, and that asymmetry is preserved rather
than tidied: `recordId` + `viewName` stays TOLERATED, and `runAction` composes with
`viewName` or `filters` — it is refused with `recordId` only. Six negative controls pin
the neighbours that must still parse.

Two `.describe()` strings and the `NavigationItem` interface doc taught a
`Precedence: recordId → filters → viewName` that no longer resolves anything — the
combination is refused, so an author following the sentence got a rejection. They now read
`Mutually exclusive with recordId/viewName.`, matching the spec's own describe.

`@objectstack/spec`'s declared floor moves `^17.3.0` → `^17.4.0`: 17.4.0 is the first
published version that EXPORTS the rule (bisected across the published 17.x line against
each version's own tarball, not against workspace resolution). The published artifact now
references the symbol, so `check:spec-floors` requires the floor to carry it.
