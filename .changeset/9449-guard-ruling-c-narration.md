---
---

Tooling only, no package released: `scripts/check-governed-queue-guard.mjs` now narrates the landing
rule it already enforces. Its `--test` answer, its merge-queue refusal remedy, its pull-request early
warning and its header used to tell a seat to park a governed pull request as a draft and leave the
merge to the maintainer, calling that merge the review record. The rule this repository's
`AGENTS.md` governed-surface section states is ruling C (maintainer 2026-09-13): the draft waits for
an APPROVED review by a `GOVERNED_APPROVERS` account, on any commit and not dismissed; that approval
is the review record, and after it the claiming seat readies the pull request and arms auto-merge,
and the queue lands it. No decision branch changed. The self-test pins the new order (DRAFT, then
the authorized approval, then the claiming seat lands it) in all three printed texts and pins the
old wording absent from them (objectui#9449).
