---
---

Run `pnpm dedupe --lockfile-only` once on an untouched `main` and commit the
result (objectui#9215). Lockfile only: no package source, no manifest, no
declared range and no override moves, so no package is released by this change.
