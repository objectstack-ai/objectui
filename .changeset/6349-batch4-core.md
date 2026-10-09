---
'@object-ui/core': minor
---

`ActionContext` is re-exported from `@object-ui/types` instead of declared a second time (objectui#6349, batch 4), so an import of the name from either package is the same type.

**Type change, breaking for some consumers.** The runner's copy typed `record` and `user` as `any`; the one declaration types both as `Record<string, any>`. A non-object `record` or `user` on a value typed `ActionContext` no longer type-checks, and under `strict` a read such as `context.record.id` now needs optional chaining (`context.record?.id`). `data`, `selectedRecords`, `pageVariables` and the index signature are unchanged. No runtime behaviour changes.
