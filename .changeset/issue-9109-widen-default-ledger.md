---
---

Test-only: the flow-node designer's declared-default ledger now walks every declaring field against its own per-node-type spec schema instead of stopping at the approval-escalation block. No published source file moves — `@object-ui/app-shell` publishes `dist` and `src/styles.css`, and the only file touched is a `*.test.ts` under `src/views/`. Recording, not releasing (objectui#9109).
