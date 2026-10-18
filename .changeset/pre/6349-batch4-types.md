---
'@object-ui/types': minor
---

`ActionContext` and `ActionResult` each have one declaration again, here, and `UndoableOperation` is published from this package (objectui#6349, batch 4). `@object-ui/core` used to declare second copies of `ActionContext`, `ActionResult` and `UndoableOperation`; it now re-exports these, so both packages publish the same types under those names.

**Type changes, breaking for some consumers.**

- `ActionContext` gains a declared `data?: Record<string, any>` member, the one member only the runner's copy declared (the runner reads it as the fallback record id and as an API request body). Before, `data` was reached only through the index signature, as `any`. A write of a non-object `data` on a value typed `ActionContext` no longer type-checks.
- `ActionResult` becomes the runner's contract. It gains `reload`, `redirect`, `modal`, `silent` and `undo` (typed `UndoableOperation`). Its `refresh` member is **removed**: the runner reads `reload`, and nothing read or wrote `refresh`, so a handler that set it was ignored at runtime. A result literal naming `refresh` is now a compile error; write `reload` instead.
- `UndoableOperation` (the `undo` payload: `id`, `type`, `objectName`, `recordId`, `timestamp`, `description`, `undoData`, `redoData`) is a new export, moved down from `@object-ui/core` with the same members.

No runtime behaviour changes.
