---
---

Give the repository root a tree spelling in the markdown test-input ledger, so a root-level
markdown document a pull request ADDS is on the `Test (shard N/4)` trigger (objectui#9142).
A document inside a declared `…/**` tree inherits that declaration the moment it lands; the
root had no tree spelling, so each root document was declared per file and the next one was
on no entry at all. `check-doc-links.test.ts`, whose stated job is to fail on a root document
with no `SCAN_ROOTS` row, was therefore the test that did not run at the one moment it was
written to speak. `./*` is the root's spelling: depth 1, markdown only — ⛔ not a widening to
"every markdown file". Tooling and tests only; no package is released by this change.
