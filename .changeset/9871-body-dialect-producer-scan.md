---
---

Derive the `body`-dialect producer table from a SCAN under a written criterion,
instead of from an enumeration (objectui#9871).

`scripts/body-dialect-producer-scan.mjs` states what counts as a producer — C1
emission, C2 resolution, C3 carrier — and answers it over the tree on every run.
The criterion, the exclusions and the limits are emitted with the reading in
both output modes, so the table cannot be quoted without what made it a table.

The scan closes the two directions `scripts/body-dialect-census.mjs` declares it
is blind in: it requires no sibling `type` (so a `body` on a non-node item is
visible) and it reads inside string and template literals (so a spelling a tool
writes into the author's document is visible). Both closures are pinned against
the census as a differential control in
`scripts/__tests__/body-dialect-producer-scan.test.ts`, on the values the two
implementations disagree about.

The `the platform SHIPS the dialect it is being asked to refuse` block in
`scripts/__tests__/body-dialect-census.test.ts` now reads that table rather than
naming sites by hand; its claim and its handoff condition are unchanged.

Tooling and tests only — no package is released by this change.
