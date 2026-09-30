---
'@object-ui/types': minor
---

`ObjectGridSchema`'s zod mirror declares `title`, the deprecated legacy
caption/export-file-title fallback the interface has declared all along and
`ObjectGrid` reads at both of its `schema.label || schema.title` sites
(objectui#6639, census-directed maintainer ruling 2026-08-29, declare branch:
authored `object-grid.title` nodes exist, so the key is declared rather than the
read retired — dropping the read would have silently cost those nodes their
caption).

The gain is the typed refusal: the mirror's `.passthrough()` base was already
admitting any `title` unexamined, and it now enforces the declared `string`.
`zod-mirror-parity.test.ts`'s `UnmirroredDeclared` ledger records the key as
worked off — the ledger's first shrink by repair (97 + 1 mirrored + 23
reclassified is what the seeded "121" now means).

**Correction, 2026-09-30 (objectui#6152, round 4).** The last sentence above says "97 + 1 mirrored + 23 reclassified" is what the seeded "121" now means. That was a reading when this change was written, and it no longer is: later changes mirrored, retired and reclassified further keys, and the survivor count it names went stale before objectui#6152 round 3. No live decomposition of "121" is kept anywhere, because the ledgers record no per-key provenance. The dated readings, and the live total, are in `zod-mirror-parity.test.ts`, whose pins derive them. The mirroring of `title` this entry describes is unaffected.
