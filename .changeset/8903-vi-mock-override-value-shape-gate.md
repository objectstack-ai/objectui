---
---

Tooling-only change. Adds `scripts/check-vi-mock-override-shape.mjs`, a third
gate over the `vi.mock` population: it compares an override's VALUE shape
against the shape the real export declares. The two existing gates judge whether
a relative specifier resolves and whether the factory inherits the real module,
and neither judges the override's value — measured, by putting the thirteen
drifted `useRecordPresence` stubs back on disk and watching both print a
byte-identical verdict line and exit 0 (objectui#8083, repaired by PR #8902).
No published package changes: the edits are the new gate, its test, a
`package.json` script alias and one `lint.yml` step, none of which any package's
`files[]` ships.
