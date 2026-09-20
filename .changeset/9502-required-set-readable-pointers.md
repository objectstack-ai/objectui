---
---

Prose-only repair, no published behaviour changes. Four sentences told an author that the merge
queue's required-check set cannot be read from this repository, and that the four `Test (shard N/4)`
contexts are not in it: the `declared = enforced` docblock in `scripts/dependabot-merge-gate.mjs`,
step 3 of the Merge Queue sequence and the Dependabot Auto-Merge bullet in
`content/docs/guide/ci-cd-pipeline.md`, and the `does NOT do` list in the header of
`.github/workflows/dependabot-auto-merge.yml`. All four were true when written — objectui#4959
recorded a merge landing while all four shards were `in_progress`, which is possible only if none of
them was required — and the ruleset was edited afterwards without the prose moving. An author who
trusted one of them and renamed or re-sharded the test jobs would block every pull request in the
repository on contexts that can never be produced again, and only a maintainer can edit the ruleset
back.

Each sentence now splits the read half from the write half rather than being deleted: the surface
still cannot be written from here (the branch-protection endpoint answers 403 to an Actions token),
and the read half points at the instrument that already takes the reading live —
`scripts/check-required-check-set.mjs`, wired as `pnpm check:required-check-set` and run daily by
`.github/workflows/required-check-set-patrol.yml` — instead of restating its answer. The inventory
docblock in that gate and the quotation of it on the CI/CD page were updated to match, and the
`AGENTS.md` carrier is recorded there as deliberately left standing, with the reason. A new block in
`scripts/__tests__/check-required-check-set.test.ts` holds the three repaired files to the pointer,
using the untouched `AGENTS.md` carrier as the control that proves the detector fires.
