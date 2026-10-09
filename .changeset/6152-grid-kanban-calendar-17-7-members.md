---
'@object-ui/types': minor
'@object-ui/plugin-grid': patch
'@object-ui/plugin-kanban': patch
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-view': patch
'@object-ui/console': patch
---

feat(types)!: `object-grid` `operations` and the `object-grid` / `object-kanban` / `object-calendar` `filter` follow the `@objectstack/spec` 17.7.0 rows (objectui#6152, round 8)

Clause-②: no

**Narrowed (breaking).** `@objectstack/spec` 17.7.0 types `object-grid`'s `operations` as the
strict `{ create?, update?, delete?, export? }` block, refusing `read` and `import` by name, and
the `filter` of `object-grid`, `object-kanban` and `object-calendar` as the `ViewFilterRule` array
`[{ field, operator, value }, ...]`, refusing the MongoDB-style record and the AST tuple array.
`@object-ui/types` now says the same, with no alias window:

- `ObjectGridSchema.operations` takes the row's block by reference. `read` and `import` are
  `?: never` on the interface and refused by name at their own path on the flat zod
  `ObjectGridSchema`: no `object-grid` code reads either. The flat mirror is the source of an
  `object-view`'s `table` slot, so `table.operations.read` / `.import` are refused there too, and
  the `read` refusal names the view-level spelling, `navigation: { mode: 'none' }` or the view's
  own `operations: { read: false }`.
- `ObjectGridSchema.filter`, `ObjectKanbanSchema.filter` and `ObjectCalendarSchema.filter` take
  their row's own member by reference, on the interface and on the zod mirror. They were `any[]`
  and `z.array(z.any())`, so `filter: [['status', '=', 'open']]` type-checked and parsed. It is now
  refused, on an authored `object-kanban` / `object-calendar` node and in an `object-view`'s
  `table` slot; respell it `filter: [{ field: 'status', operator: 'equals', value: 'open' }]`.

What did not move: an `object-view`'s own `operations.read` (the protocol has no `object-view`
row, and `ObjectView` reads it as its row-click gate), and the renderers' reads. `ObjectGrid`
still lowers an AST array, and the board and the calendar still hand whatever `filter` reaches
the node to `$filter`, because hosts compose that form at runtime.

- `@object-ui/plugin-view`: the grid node `ObjectView` composes no longer carries the view's
  `read` toggle in its `operations` block; the view keeps reading it.
- `@object-ui/plugin-grid`, `@object-ui/plugin-kanban`, `@object-ui/plugin-calendar`: the
  registrations' `filter` inputs describe the `ViewFilterRule` array, and the grid's `operations`
  input names the four toggles.
- `@object-ui/console`: the registry parity pins' prose stops calling these rows `z.unknown()`.
