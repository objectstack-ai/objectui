---
'@object-ui/types': minor
---

Declare `pageSize` on `ObjectDataTableSchema`, on both faces (objectui#11348).

`ObjectDataTable` spreads its `object-data-table` node into the `data-table` it
renders, and `data-table` reads `pageSize`, so the key was honoured on
`object-data-table` without being declared on the TypeScript interface or on the
zod mirror. It compiled through `BaseSchema`'s index signature, which
objectui#8347 removes, and parsed through `.passthrough()` unexamined.
`@object-ui/plugin-dashboard`'s drill-down drawer writes it on the node it
builds, from its `maxRows`, and the drilled list's row count depends on it.

The member is `DataTableSchema`'s own, by reference on each face, declared beside
the node's other keys forwarded to `data-table`, `searchable` and `pagination`.
No spec row reaches `object-data-table`, so the declaration follows the
implementation (the governing text of the objectui#11347 `list.title` ruling).

**minor — the published face gains a member** (objectui#7722's class). A numeric
`pageSize` now type-checks without the index signature and is accepted by the
strict authoring face. A non-number is refused by value on the mirror and by
`tsc`. Nothing that rendered changes how it renders.
