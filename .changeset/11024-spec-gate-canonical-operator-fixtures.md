---
---

Test-only change to `@object-ui/types`; no published behaviour changes. objectstack#20503 typed a view filter rule's input `operator` as the canonical `ViewFilterOperator`, so the two `z.input`-typed fixtures in `p2-spec-exports.test.ts` now author `'equals'` instead of the legacy alias `'eq'`, and the comment that called `'eq'` a valid input says what is true upstream: only the type narrowed, and the runtime fold of a stored or plain-JS alias is unchanged (objectui#11024).
