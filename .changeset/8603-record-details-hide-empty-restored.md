---
'@object-ui/plugin-detail': minor
'@object-ui/types': minor
---

`record:details` honours `hideEmpty` on a section again — an all-empty section hides itself, `hideEmpty: false` keeps its heading and skeleton

**User-visible.** A `record:details` section whose fields are ALL empty now renders nothing at all — no heading, no skeleton — unless the page writes `hideEmpty: false` on it, which keeps the heading and the label skeleton a brand-new record needs. That is the behaviour `@objectstack/spec` declares on `RecordDetailsProps.sections[]` and describes in the key's own `describe()` text, and this renderer had stopped delivering it.

⚠️ **The unauthored default moved — and read that against the RELEASE, not against `main`.** An all-empty authored section rendered its skeleton on `main` from 2026-09-01, which is after the previous release, so the two entries that produced that state are still pending and ship alongside this one. Net for a consumer upgrading: the key is declared upstream and honoured here, `hideEmpty: false` works for the first time, and the empty-section default for an AUTHORED `record:details` section is unchanged from the last published release. Pages that want the skeleton on an all-empty section write `hideEmpty: false` — a spelling that parses green on the strict section object since spec 17.3.0, which is precisely what it could not do when the read was retired.

**Release-note reconciliation, done by correction rather than by rebuttal.** Two pending entries in this same release contradicted the above, and their prose has been corrected in place (frontmatter and declared packages untouched): `7129-retire-detailviewsection-hideempty.md`, whose migration step told authors to delete `hideEmpty` — an instruction a reader acts on, and one that would now delete the very spelling that keeps a skeleton — and `7064-empty-section-default.md`, whose "a sparse record keeps its section skeleton" holds for the fallback body and the `detail-view` node but no longer for an authored `record:details` section. Naming them from here instead would have left the migration step live in the same CHANGELOG.

**What did NOT change.** The empty ROWS of a section that still has a filled row stay with `DetailSection`'s auto-hide heuristic and the reader's "Show N empty fields" toggle, which no authored value overrides in either polarity (objectui#7129 Q2-C, left standing by the ruling). Inline-edit mode renders an all-empty section either way, so its fields never become unreachable. `record:reference_rail`'s own component-level `hideEmpty` and the `detail.hideEmptyFields` toggle label are different keys and are untouched.

**Why it moved twice.** objectui#7129 (maintainer 2026-09-01) retired the declaration and the read because `@objectstack/spec` REFUSED the key — true at the 17.2.0 pin this repo held. Upstream had already declared it (17.3.0, upstream #11289, maintainer ruling 2026-08-23 direction 1, taken from a measured symptom), so once the pin moved the contract promised an author a behaviour the renderer no longer had, and it parsed green at publish. objectui#8603 (director seat batch #137 item 3, maintainer 2026-09-15) ruled the protocol correct and restored the read; #7129's Q1-A is superseded for this key only.

All four parties now agree — the spec declares it, `@object-ui/types` declares it, the `DetailViewSectionSchema` zod mirror carries it, and the renderer reads it — pinned together in `packages/plugin-detail/src/renderers/__tests__/record-details.hideEmptyRetired-7129.test.tsx`.
