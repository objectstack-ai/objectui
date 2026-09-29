---
'@object-ui/plugin-view': patch
'@object-ui/types': minor
---

An `object-view`'s `table` now hands the grid it draws every grid key it types, and stops
typing the grid keys that had nothing to act on there (objectui#10976).

**What was wrong.** `ObjectViewSchema.table` declared every `ObjectGridSchema` member except
`type` and `objectName`, while the grid node `ObjectView` builds copied a fixed handful of
them. So `table: { editable: true }`, and `frozenColumns`, `rowHeight`, `rowActions` and the
rest, type-checked, passed the validator, and did nothing.

**`@object-ui/plugin-view` (fix).** The registered `object-view` renderer now relays these
`table` keys to its grid as written, each one a key `ObjectGrid` reads: `editable`,
`singleClickEdit`, `frozenColumns`, `rowHeight`, `resizable`, `reorderableColumns`,
`searchableFields`, `showSearch`, `showPagination`, `showColumnTypeIcons`,
`conditionalFormatting`, `rowActions`, `bulkActions`, `bulkActionDefs`, `exportOptions`,
`grouping`, `aggregations`, `rowColor` and `label`. A key is copied only when you write it, so
a view that writes none of them renders as before. Where the active named view declares the
same member, the named view still wins and `table` is the fallback. `ObjectGrid` still gates
`editable` on the object's inline-edit grant. A host that supplies `renderListView` still takes
only `columns`, `fields`, `filter` and `sort` from `table`.

**`@object-ui/types` (breaking for a writer of a withheld key, hence `minor`).** The `table`
slot no longer declares the grid keys the view's grid does not honour:

- no read in `ObjectGrid`: `showFilters`, `keyboardNavigation`, `rowSpecActions`,
  `bulkSpecActions`, `name`, `placeholder` (the last four retired from `object-grid` itself by
  objectui#11068);
- not handed on by the view: `emptyState`, `description` (`ObjectGrid` honours both on an
  `object-grid` node since objectui#11068; write them there);
- owned by the view: `data`, `staticData`, `bind` (the view lists its own `objectName`),
  `navigation`, `onNavigate` (write them on the `object-view` node), `id`;
- node-level keys, which no renderer applies to a grid the view draws as a component: `style`,
  `testId`, `ariaLabel`, `hidden`, `hiddenOn`, `visible`, `visibleOn`, `visibleWhen`,
  `disabled`, `disabledOn`;
- legacy aliases of a relayed key: `batchActions` (write `bulkActions`) and `resizableColumns`
  (write `resizable`).

**Who breaks.** TypeScript code that writes one of those keys inside an `object-view`'s
`table` now fails to compile (excess property), and a document that carries one fails
`safeValidateSchema` / `objectui validate` with a message that names the key and says why it
reached nothing. None of them ever reached the grid, so no rendered view changes. Remove the key,
or move `navigation` / `onNavigate` / `description` to the `object-view` node. No example,
doc or builder in this repository writes one.

The slot's key list and the withheld set are pinned against drift by
`packages/types/src/__tests__/object-view-slot-key-lists.test.ts`, which also requires the
validator to refuse every withheld key by name, so the two faces refuse the same keys.
