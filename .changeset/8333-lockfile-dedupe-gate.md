---
---

Require the committed `pnpm-lock.yaml` to be deduped (objectui#8333).

New gate `scripts/check-lockfile-dedupe.mjs` + `.github/workflows/lockfile-dedupe.yml` runs
`pnpm dedupe --check` on pull requests that touch the lockfile, and the Dependabot merge gate
classifies the resulting `Lockfile Dedupe Check` as a blocking context. A dependency bump can
re-resolve part of the peer graph and fork a single-copy package without changing any declaration,
range or override; `Bundle Analysis` then reads the growth as the bump's. This makes
`pnpm dedupe` a requirement of the bump pull request instead, so that reading is attributable.

CI, scripts and docs only; no package is released by this change.
