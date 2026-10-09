---
'@object-ui/types': minor
---

`ActionContext` has one declaration again (objectui#6349, batch 4). `@object-ui/core` used to declare a second `ActionContext` in its action runner; it now re-exports this package's, so both packages publish the same type under the name.

**Type change.** `ActionContext` gains a declared `data?: Record<string, any>` member, the one member only the runner's copy declared (the runner reads it as the fallback record id and as an API request body). Before, `data` was reached only through the index signature, as `any`. A write of a non-object `data` on a value typed `ActionContext` no longer type-checks. No other member changes.
