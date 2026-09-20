---
---

CI and documentation only; no published package changes. `pnpm check:doc-examples`
(`scripts/check-doc-example-types.mjs`) was declared in the root `package.json` and
invoked by no workflow. It now runs as the last step of the `doc-snippet-types.yml`
job, whose filtered build is already this gate's precondition, and
`content/docs/guide/ci-cd-pipeline.md` documents it by command alongside its two
siblings. Its verdict on unmodified `main` before the wiring was exit 0 over 124
`@example` blocks, so nothing was narrowed to make a newly wired gate green.
