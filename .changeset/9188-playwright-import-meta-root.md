---
---

Root `e2e/live/inline-edit-polish-2572.spec.ts`'s storage-state read on the spec
file itself instead of on the ambient working directory, and empty the
`KNOWN_CWD_ROOTED` registry in `scripts/check-test-path-roots.mjs`
(objectui#9188). Test and gate only; no package is released by this change.
