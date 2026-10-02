---
'@object-ui/console': minor
---

chore(console)!: drop the lazy `tree` registration stub (objectui#10859, batch 8)

**BREAKING (authoring):** the console no longer registers a lazy `tree` stub for `@object-ui/plugin-tree`, which retired that key. `object-tree` stays lazily registered.

Migration:

- `{ "type": "tree", … }` → `{ "type": "object-tree", … }`.

**Clause-②: yes**, released as `minor` with this banner.
