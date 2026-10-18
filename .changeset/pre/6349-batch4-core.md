---
'@object-ui/core': minor
---

`ActionContext`, `ActionResult`, `UndoableOperation` and `ComponentMeta` are re-exported from `@object-ui/types` instead of declared a second time here (objectui#6349, batch 4), so an import of any of these names from either package is the same type. The registry's own registration type gets its own name, `RegistryComponentMeta`.

**Type changes, breaking for some consumers.**

- **`ComponentMeta` from this package no longer carries the five registry-only keys** (`tier`, `namespace`, `skipFallback`, `labelling`, `deprecated`). It used to be this package's registration type, `@object-ui/types`' `ComponentMeta` plus those keys, published under the general name. That type is now `RegistryComponentMeta`, with the same members. `ComponentRegistry.register`, `registerLazy` and `getMeta` are typed with it, so a registration literal passed straight to them still compiles. Code that annotates a value as `ComponentMeta` from `@object-ui/core` and writes or reads one of the five keys must use `RegistryComponentMeta` instead (for example `RegistryComponentMeta['labelling']`).
- `ActionContext`: the runner's copy typed `record` and `user` as `any`; the one declaration types both as `Record<string, any>`. A non-object `record` or `user` on a value typed `ActionContext` no longer type-checks, and under `strict` a read such as `context.record.id` now needs optional chaining (`context.record?.id`). `data`, `selectedRecords`, `pageVariables` and the index signature are unchanged.
- `ActionResult` and `UndoableOperation` keep their members exactly; only their declaring package moves.

No runtime behaviour changes.
