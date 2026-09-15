---
---

Test-only. A vitest that a test spawns no longer inherits this container's
`std-env` agent markers (objectui#8616): `scripts/__tests__/helpers/child-vitest-env.ts`
builds the child's environment for all four spawn sites, so the child is
configured the way CI configures it — colour, reporter and coverage defaults —
instead of the way an agent container silently configures it. No published
behaviour, no schema and no publish-contract field changes; nothing in `dist/`
differs.
