---
'@object-ui/types': minor
'@object-ui/plugin-detail': minor
---

**Retired: `DetailViewSection.hideEmpty`.** The `record:details` section key is
gone from `@object-ui/types` and `RecordDetailsRenderer` no longer reads it.
Emptiness on a detail section is now decided entirely by `DetailSection`'s
auto-hide heuristic — hide empty rows only while the section still has at least
one filled row, never on an all-empty section — with the reader's
"Show N empty fields" toggle as the escape hatch.

**Minor, not major, and deliberately so.** The key was never authorable on any
validated page: `@objectstack/spec` `RecordDetailsProps` REFUSES it, returning
`unrecognized_keys: ['hideEmpty']` on the `sections[]` element (measured on the
installed 17.2.0, against a `columns: 2` control that parses and whose value
survives). So a spec-compliant document could not carry the key, and a document
that carried it anyway failed to parse before it ever reached the renderer.
What this release removes is a *declaration* that invited authors — and code
generators reading the published `.d.ts` — to write a key the platform refuses.
That narrows a published type surface, which is what makes it a minor rather
than a patch; it retires no capability anyone could exercise.

One key had four contracts and three answers: `@object-ui/types` declared it,
`RecordDetailsRenderer` honoured it, the `DetailViewSectionSchema` zod mirror
omitted it, and the spec refused it. The maintainer converged the four on the
spec's answer (2026-09-01) as it stood then. All four are pinned together in
`record-details.hideEmptyRetired-7129.test.tsx`.

⚠️ **What that convergence settled on has since moved, inside this same
release.** The premise was that the spec refuses the key — true of the 17.2.0
pin this repo held, and already false upstream. `@objectstack/spec` 17.3.0
declares the key with a description promising the behaviour this entry removed,
so the maintainer ruled the protocol correct and restored the read. Net for a
reader of THIS release: the key is declared upstream, honoured here, and
`hideEmpty: false` works. The paragraphs above describe a step this release
takes and then takes back; the restoration entry is the one that describes what
ships.

Going with it is the paradox the key carried: `DetailSection` tested
`!section.hideEmpty`, so an authored `hideEmpty: false` was indistinguishable
from an unauthored section and overrode nothing. There is no longer a lever to
misread.

**Supersedes one paragraph of the `record:details` empty-section changeset in
this same release.** Its closing "What does not change: an authored `hideEmpty`
keeps its exact former meaning" no longer holds — an authored `hideEmpty` of
either polarity is now inert, and the release notes should read that way.
Everything else in it stands: the unauthored default is unchanged, and so is
the label-graveyard guard.

**⚠️ Migration: none — superseded inside this same release. ⛔ Do NOT delete
`hideEmpty` from your sections.** This entry originally told you to, because at
the time the key was retired here and refused by `@objectstack/spec`. Both
halves changed before this release shipped: the spec DECLARES
`RecordDetailsProps.sections[].hideEmpty` from 17.3.0, and the
`record:details` read is RESTORED later in this same release — see the
`hideEmpty` restoration entry, which states the behaviour that actually ships.
A section that authors `hideEmpty` keeps its meaning; `hideEmpty: false` is how
an all-empty section keeps its heading and label skeleton.

**Not affected**, despite the shared name: `record:reference_rail`'s own
`hideEmpty` prop, which is a different surface and still live; and the
`detail.hideEmptyFields` i18n label behind the toggle.
