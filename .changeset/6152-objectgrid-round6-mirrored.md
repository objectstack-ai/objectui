---
'@object-ui/types': minor
---

feat(types): `ObjectGridSchema`'s zod mirror declares ten members its TypeScript twin declares (objectui#6152, round 6)

**Breaking for an invalid document, hence `minor`:** a wrongly typed value for one of these keys inside an `object-view`'s `table` is now refused by `safeValidateSchema` / `validateSchema`, where it used to be kept unexamined.

**What changed.** The flat `ObjectGridSchema` mirror in `@object-ui/types/zod` now declares `aggregations`, `bulkActionDefs`, `conditionalFormatting`, `grouping`, `navigation`, `operations`, `reorderableColumns`, `rowColor`, `rowHeight` and `singleClickEdit`, each typed as the TypeScript `ObjectGridSchema` types it. `ObjectGrid` reads every one of them, and the spec's `object-grid` row declares every one. `grouping`, `navigation`, `rowColor` and `rowHeight` are the spec's `GroupingConfigSchema`, `NavigationConfigSchema`, `RowColorConfigSchema` and `RowHeightSchema` by reference; `reorderableColumns` and `singleClickEdit` are the row's own members. `operations`, `aggregations` and a `bulkActionDefs` entry name an unknown member instead of dropping it.

**Where you see it.** The `object-view` `table` slot is built from this mirror, and `ObjectView` hands nine of these keys to the grid it draws (`navigation` stays refused there, as before):

- the strict authoring face, which `objectui validate` runs, now accepts `table.grouping`, `table.rowHeight` and the other seven. It refused them as unknown keys although the TypeScript slot typed them;
- the tolerant face refuses a wrong value at the key: `table: { rowHeight: 'comfortable' }`, `table: { operations: { creat: false } }`, or a `grouping` field name with surrounding spaces, which the spec's own rule refuses.

`ObjectGridSchema.safeParse` called directly judges the same ten keys.

**What did not move.** An authored `object-grid` node takes its props in the spec's `properties` bag (objectui#11276), and that bag is still the spec row by reference, so a document's `object-grid` node parses exactly as before. `resizableColumns` stays declared on the TypeScript face and is not mirrored. No TypeScript declaration changed shape. The `singleClickEdit` doc comment now says `@default true`, which is what `ObjectGrid` and the spec row do; it said `false`.

**Clause-②: yes** — the strict face widens on the `table` slot, and the tolerant face narrows there for wrongly typed values.
