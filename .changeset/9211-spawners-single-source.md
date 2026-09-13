---
---

Give the two spawned-child-environment gates ONE definition of what counts as a
child-process spawner (objectui#9211). Test tooling only; no package is released
by this change.

`spawned-build-vitest-env-8598.test.ts` and `spawned-vitest-child-env-8616.test.ts`
each carried a hand-maintained copy of the same `SPAWNERS` set, and the copies had
diverged: objectui#8616's listed `fork`, objectui#8598's did not, and neither
file's prose gave a reason. Dropping a member from a POPULATION set is a false
GREEN — a build started as `fork('…', ['build'], { env })` never entered
objectui#8598's census, so the gate that exists to stop `VITEST` reaching a
spawned build would have reported clean about a call site it never looked at.

The repair is the construction, not the instance: both gates now import
`scripts/__tests__/helpers/spawners.ts`, so there is no second literal to keep
honest. Converged upward, onto the set that includes `fork` — the other
direction narrows a live gate's census, which is not a repair.

`fork` is latent rather than live: the test tree holds zero `fork(` call sites,
so a green suite would carry no information about whether the new member works.
A fixture pair under `scripts/__tests__/fixtures/spawned-build-vitest-env-8598/`
supplies the population the tree does not have — the same `fork()` build spawn
twice, differing only in whether the child's `env:` still carries `VITEST` — and
the gate is driven over both, asserting the population count as well as the
verdict so an empty census fails loudly instead of clearing everything.
