---
---

objectui#8071 slice 10 — three `object-form` keys leave `MEMBER_PIN_EXEMPTIONS` and
become real per-block member pins: `initialValues`, `initialData` and
`submitBehavior`. `MEMBER_PIN_EXEMPTION_CEILING` follows 31 -> 28 in the same
change, as every slice of that card owes.

The pins constrain what the RENDERER reads, which is objectui#8068's criterion:
`initialData` and `initialValues` are chosen between as WHOLE OBJECTS
(`schema.initialData || schema.initialValues`), so with both authored every
`initialValues` member is dropped rather than merged, and an empty `initialData`
shadows a populated `initialValues` entirely; `submitBehavior`'s `delayMs` is the
number the redirect wait is armed with rather than a constant, and `next-record`
is a declared arm that reaches the confirmation panel and reads no members of its
own.

Tests and one exemption ledger only. Measured rather than assumed: with
`@object-ui/plugin-form` and `@object-ui/console` both built, no byte of this
change reaches either package's published `files[]` output (markers
`objectFormInitialMembers`, `MEMBER_PIN_EXEMPTION_CEILING`, `AWAITING_A_PIN`: 0
hits) while the positive controls on the same corpus are lit (`submitBehavior`: 7
files in `packages/plugin-form/dist`; `object-form`: 12 files in
`apps/console/dist`). No package is released by this change.
