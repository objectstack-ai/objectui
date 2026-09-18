---
---

Test-only change: three `object-master-detail-form` registry inputs —
`initialData`, `initialValues` and `sections` — become per-block member pins,
and their `MEMBER_PIN_EXEMPTIONS` entries are deleted in the same change with
`MEMBER_PIN_EXEMPTION_CEILING` following down to match the new count
(objectui#8071 slice 15, criterion from objectui#8068).

The seed pair is pinned in ONE file because this block's own registration
declares it a pair — `initialData` is "Alternate spelling of `initialValues` the
renderer also reads" — and pinning one alone would leave the precedence between
them stated nowhere. The pins constrain what the RENDERER reads: the two keys
are chosen between as WHOLE OBJECTS (`schema.initialData || schema.initialValues`),
so with both authored every `initialValues` member is dropped rather than merged
and an EMPTY `initialData` shadows a populated `initialValues` entirely; the seed
reaches the parent leg of the atomic batch and mints no child operation; and in
`edit` mode the fetched record replaces both keys wholesale. For `sections`, a
member's `fields` are read as a SET so the object's order wins, a member that
resolves to no parent field is dropped heading and all, and — a divergence from
this block's own registration, recorded as behaviour and handed back as a
finding — `fields` is NOT ignored when `sections` is given: the two intersect and
a section member outside `fields` is dropped silently.

No published behaviour changes and no published byte moves, measured rather than
assumed on the corpus each package's `package.json` `files[]` actually ships,
after building both. In `@object-ui/plugin-form`'s published corpus the two new
test-file basenames and the ledger's own symbols (`MEMBER_PIN_EXEMPTION_CEILING`,
`AWAITING_A_PIN`) read zero, while `MasterDetailForm` and `initialData` are lit in
the same scan; in `@object-ui/console`'s published corpus `MEMBER_PINS`,
`MEMBER_PIN_EXEMPTIONS`, `MEMBER_PIN_EXEMPTION_CEILING`, `AWAITING_A_PIN` and both
test-file basenames read zero, while `object-master-detail-form` and `object-form`
answer in the same corpus. No package is released by this change.

Refs objectui#8071, objectui#8068.
