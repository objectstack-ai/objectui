---
---

Test-only change: `zod-mirror-parity.test.ts` now states in its header which command
judges which half of it — `tsc -p tsconfig.test.json` (the third leg of
`@object-ui/types`' `type-check`) for the type-level ratchet, `vitest` for the runtime
population census. No published behaviour changes and no published source moves; the
file is a test, and only its header comment was edited.

Why it needed saying (objectui#9546): the file carries both halves while wearing a
`.test.ts` extension, so the obvious way to "check parity" is to run it with vitest —
and that exercises the half that cannot see the ratchet. Re-measured on this branch by
`.omit()`-ing both content channels off one registered mirror: vitest exited 0 on the
violated tree, `tsc -p tsconfig.test.json` exited 2 with `TS2322` on the identical
tree. The wording follows the convention already used by
`report-schema-authoring-face.test.ts` in the same directory.
