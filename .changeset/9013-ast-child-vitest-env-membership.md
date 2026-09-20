---
---

Judge the spawned-vitest child environment by what it IS rather than by whether
`childVitestEnv`'s name occurs in its text (objectui#9013).

`scripts/__tests__/spawned-vitest-child-env-8616.test.ts` derived its population
of vitest spawns by AST and then judged each one with `env.includes('childVitestEnv')`
over the resolved `env:` text. A comment lives inside the declaration's span, so a
call site somebody explained instead of fixing passed the gate. Measured with two
probe files differing by one comment line and nothing else: without the helper's
name the gate refused the spawn at `1 failed | 4 passed`; with
`// childVitestEnv() would be the right thing to use here.` above the same
hand-rolled `{ ...process.env, CI: 'true' }` it accepted it at `5 passed`.

The `env:` expression is now classified on nodes — a call to `childVitestEnv()`, or
an object literal spreading one, reached directly or through the name the spawn
passes — so a comment about the helper resolves to nothing. The population walk,
its pre-filter, the floor, the named member and the live `isAgent` probe are
untouched; the population is still four spawns and all four still pass.

Test only; no package is released by this change.
