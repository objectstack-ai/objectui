---
---

Internal tooling only, no released package moves: `scripts/check-installed-spec-pin-claims.mjs`
is new, its vitest suite is new, and the root manifest gains one `check:*` alias. No `src/`,
no published `files[]` entry, no publish-contract field. `node scripts/check-changeset-presence.mjs`
agrees ("0 of them published source of a package the release covers"); this file is the explicit
declaration rather than a silent absence.

What it adds (objectui#8924): the installed `@objectstack/spec` pin is stated in prose in 59
places that the artifact contradicts, and nothing read those sentences. objectui#8897 corrected
the `17.3.0` cohort with a probe that was version-literal on `17.3.0` and therefore blind by
construction to the identical sentence about an earlier pin. This gate resolves the pin from two
faces (`pnpm-lock.yaml` and the resolved tree), recognises pin claims by PREDICATE — a version
plus a present-tense installed-ness marker — and fails when the two disagree, with the whole
population carried in a ledger that ratchets in both directions.
