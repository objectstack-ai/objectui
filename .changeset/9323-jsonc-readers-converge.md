---
---

Test-only: the two private JSONC comment readers in the test tree converge on
`jsonc-parser`, which `packages/cli/src/commands/check.ts` already declared this
repository's reader for that question. No published behaviour changes — both
tests parse their corpus to byte-identical values before and after (47 fenced
guide blocks and 1 README fence, measured on objectui#9323).
