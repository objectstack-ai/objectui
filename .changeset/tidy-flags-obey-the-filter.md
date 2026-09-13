---
---

Internal tooling only — no package release.

`packages/plugin-ai` and `packages/vscode-extension` spelled their `test` script
`vitest run --passWithNoTests --root ../.. <DIR>/`, while the other 41 workspace
members spell it `vitest run --root ../.. <DIR>/`. The flag overrode the root
config's `passWithNoTests: !cliHasTestFilters(process.argv)` back to `true`, so
for these two members alone an empty collection exited 0 instead of 1. Both
tokens are deleted; no published source, no published contract field and no
runtime behaviour changed, so nothing is owed a version bump.
