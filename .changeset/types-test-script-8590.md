---
---

Test-only and docs-only. `@object-ui/types` gains a package-level `test` script
(objectui#8590), and the one test that imports the package's own `vite.config.ts`
now scrubs `VITEST` across that single import so the invocation guard is not
re-entered against the worker's cwd. No published behaviour, no schema and no
publish-contract field changes; nothing in `dist/` differs.
