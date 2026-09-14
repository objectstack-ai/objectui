---
---

Test-only: the flow-node designer's declared-default ledger now walks every declaring field against its own per-node-type spec schema instead of stopping at the approval-escalation block. Two files move — the reconciliation test itself, and one doc comment in `flow-node-config.ts` that described the ledger's old narrow scope and would otherwise have been left stating something untrue. No declaration, option list, control or rendered value changes; `@object-ui/app-shell` publishes `dist` and `src/styles.css`, and none of the eight publish-contract fields moved. Recording, not releasing (objectui#9109).
