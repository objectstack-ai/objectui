---
---

ci(workflows): replace the `type-check` / `e2e` markdown claim in `ci.yml` with a traced reading (objectui#9241)

`ci.yml`'s `test` job carried the reason for being the only job with a markdown
second stage as an assertion — "measured: `type-check` reads no document, and no
e2e spec does" — which nothing had measured. Both populations were run under the
`fs` trace objectui#9096 built. The `e2e` suite opens no markdown document; the
`type-check` job's `check:spec-symbols` gate opens every page under
`content/docs/**`, which the decide step's pathspec excludes. Comment only — no
job, step, exclusion list or trigger changes, and the `type-check` finding is
returned for re-grading rather than acted on here.
