---
---

Clause-②: no

Test-only (objectui#12755): `useActionRunner`'s navigation test now expects the result `{ success: true, silent: true }`, because `@object-ui/core` marks a navigation-only result `silent` so it raises no success toast. `@object-ui/react`'s own source is unchanged.
