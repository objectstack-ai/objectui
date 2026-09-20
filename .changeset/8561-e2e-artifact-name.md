---
---

Rename `ci.yml`'s E2E failure upload from `playwright-report` to
`e2e-failure-artifacts`, and correct the `e2e` row of
`content/docs/guide/ci-cd-pipeline.md` to say what that upload actually holds
(objectui#8561). `playwright.config.ts` selects the `github` reporter when `CI`
is set; that reporter writes annotations and no `playwright-report/` directory,
so the zip a maintainer downloads from the Actions UI has only `test-results/`
in it and the docs row promised a report the lane has never produced. The
explanatory comment above the step and both entries of its path list are
deliberate prior art (objectui#4086) and are unchanged. CI and docs only; no
package is released by this change.
