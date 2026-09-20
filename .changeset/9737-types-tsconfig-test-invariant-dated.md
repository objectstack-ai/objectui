---
---

Date the closing invariant of `packages/types/tsconfig.test.json` and make it
state the carve-out it was silently contradicted by (objectui#9737).

The sentence "Every test file in this package is compiled; keep it that way."
was TRUE when it was written (2026-08-07, `c35fed098`, PR objectui#3574) — the
`.dist.spec.tsx` suffix did not exist anywhere in the tree yet — and was
falsified on 2026-09-09 by `1ccfc235e` (PR objectui#8646), which added this
package's first `.dist.spec.tsx` pin. ROTTED, not born false, so it is kept and
dated rather than overwritten (objectui#9713).

The `include` never moved; the population under it did. The repair names what
the sentence had stopped covering: the `.dist.spec.tsx` built-artifact pins are
excluded BY CONSTRUCTION, because turbo's `type-check` waits on `^build` (the
DEPENDENCIES' builds) and must never be handed a program that reads this
package's own `dist` (objectui#4801), and they are still RUN by the opt-in
`dist` vitest project (`DIST_PIN_GLOB`, objectui#7183). A declared exclusion and
a hole look identical in a directory listing, so the next reader had no way to
tell them apart without re-deriving the distinction — and the false sentence
pointed at the wrong answer.

No count is written into the prose; the comment points at
`pnpm type-check:coverage`, which re-derives the claim.

Comment only — no `include`, no `exclude`, no compiler option, no test file
moved. Measured, not assumed: `tsc --listFiles` for all three of this package's
`type-check` legs is byte-identical before and after, and none of the changed
bytes appears anywhere in the built `dist` this package publishes (positive
control: source-comment prose does reach `dist/*.d.ts`). No package is released
by this change.
