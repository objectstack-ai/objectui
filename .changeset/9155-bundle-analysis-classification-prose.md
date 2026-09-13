---
---

Stop this repo's eager-closure gate prose from classifying the `Bundle Analysis`
check against the branch-protection set (objectui#9155). Eight sentences across
`scripts/check-eager-closure-budget.mjs`, its test and
`.github/workflows/performance-budget.yml` asserted a fact no reader can
re-derive from inside a checkout, and the workflow's own job-ceiling comment
already contradicted the sentence four lines above it. They now cite the two
readings the tree does answer — the `OPTIONAL_CONTEXTS` entry in
`scripts/dependabot-merge-gate.mjs` with its stated path-filter reason, and the
absence of a `merge_group` leg in the workflow's `on:` block — and a new pin
keeps the claim out in either direction. Comments and one test only; no
classification changed and no package is released by this change.
