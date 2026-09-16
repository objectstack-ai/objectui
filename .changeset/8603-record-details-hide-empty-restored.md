---
'@object-ui/plugin-detail': minor
'@object-ui/types': minor
---

`record:details` honours `hideEmpty` on a section again — an all-empty section hides itself, `hideEmpty: false` keeps its heading and skeleton

**User-visible.** A `record:details` section whose fields are ALL empty now renders nothing at all — no heading, no skeleton — unless the page writes `hideEmpty: false` on it, which keeps the heading and the label skeleton a brand-new record needs. That is the behaviour `@objectstack/spec` declares on `RecordDetailsProps.sections[]` and describes in the key's own `describe()` text, and this renderer had stopped delivering it.

⚠️ **The unauthored default moved.** Until this change an all-empty section always rendered its skeleton. It now hides by default, because the spec states the renderer default as on and objectui#8603 ruled the protocol correct. Pages that want the old rendering write `hideEmpty: false` — a spelling that parses green on the strict section object since spec 17.3.0, which is precisely what it could not do when the read was retired.

**What did NOT change.** The empty ROWS of a section that still has a filled row stay with `DetailSection`'s auto-hide heuristic and the reader's "Show N empty fields" toggle, which no authored value overrides in either polarity (objectui#7129 Q2-C, left standing by the ruling). Inline-edit mode renders an all-empty section either way, so its fields never become unreachable. `record:reference_rail`'s own component-level `hideEmpty` and the `detail.hideEmptyFields` toggle label are different keys and are untouched.

**Why it moved twice.** objectui#7129 (maintainer 2026-09-01) retired the declaration and the read because `@objectstack/spec` REFUSED the key — true at the 17.2.0 pin this repo held. Upstream had already declared it (17.3.0, upstream #11289, maintainer ruling 2026-08-23 direction 1, taken from a measured symptom), so once the pin moved the contract promised an author a behaviour the renderer no longer had, and it parsed green at publish. objectui#8603 (director seat batch #137 item 3, maintainer 2026-09-15) ruled the protocol correct and restored the read; #7129's Q1-A is superseded for this key only.

All four parties now agree — the spec declares it, `@object-ui/types` declares it, the `DetailViewSectionSchema` zod mirror carries it, and the renderer reads it — pinned together in `packages/plugin-detail/src/renderers/__tests__/record-details.hideEmptyRetired-7129.test.tsx`.
