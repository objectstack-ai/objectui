---
'@object-ui/core': minor
---

chore(core)!: the record-source `data` arm table drops `tree` and `view:tree` (objectui#10859, batch 8)

**BREAKING (authoring):** `recordSourceDataArmForType('tree')` and `recordSourceDataArmForType('view:tree')` now answer `'undeclared'`, because `@object-ui/plugin-tree` no longer registers either key. The table names `object-tree` / `plugin-tree:object-tree` alone, which still answer `'view-data'`.

Migration:

- `tree` → `object-tree`; nothing else reads these rows.

**Clause-②: yes**, released as `minor` with this banner.
