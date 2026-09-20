---
'@object-ui/plugin-grid': minor
---

Derive the bulk executor's data-source face from `DataSource` and stop erasing the check at the hand-off (objectui#9722).

**Clause-②: yes (widening)** — declared conservatively, and handed to the contract-review seat
rather than settled here. What moves is `BulkExecutorOptions['dataSource']`: its two bulk doors
are now `DataSource['bulkUpdate']` / `DataSource['bulkDelete']` instead of copies that had
drifted. For an implementor that is a RELAXATION — a `bulkUpdate` accepting only
`ReadonlyArray<string>` used to be refused by this face and is now accepted; one accepting
`ReadonlyArray<string | number>` was accepted before and still is. Nothing narrows, and no
runtime behaviour changes.

**What it was.** `BulkExecutorOptions.dataSource` RESTATED the members it consumes, and the
restatement rotted: it still spelled the pre-objectui#9511 union `ReadonlyArray of string or
number` for both bulk doors after `DataSource` narrowed them to strings. Both are declared with
property syntax, so `strictFunctionTypes` compares their parameters contravariantly — the real
`DataSource` was therefore NOT assignable to that face at all. The single in-tree hand-off
(`ObjectGrid` to `BulkActionDialog`) compiled only because it erased the check with a cast to
`any`. objectui#9712's reading that narrowing those doors cost zero call sites was true BY THAT
CAST, not because the consumer agreed.

**What was measured on this branch, cast by cast** — both casts were removed one at a time, each
mutation proven on disk and restored under a `trap`:

- `ObjectGrid.tsx` → `RecordDetailPanel`: removing it type-checks GREEN. It was paying for
  nothing — both sides already declare the same `DataSource | undefined` from `@object-ui/types`.
  Removed outright.
- `ObjectGrid.tsx` → `BulkActionDialog`: removing it reddens, and it was paying for TWO things at
  once — the optional-vs-required arm (the grid declares `dataSource?: DataSource`, the dialog
  demands one) AND the bulk-door contravariance. Only the first still needs erasing, so it is now
  a non-null assertion: today's runtime behaviour is preserved exactly, and any future drift of
  the face reddens at that site instead of passing silently.

**Why `update` / `delete` are still spelled out rather than picked.** `Pick`ing all four members
imports return types this executor never reads and so NARROWS what a consumer may inject:
measured, it reddened four in-tree test doubles on `delete`'s `Promise<boolean>` alone. The two
per-row doors keep their loose returns; only the doors this card is about are derived.

Pinned from both sides by `bulkExecutorDataSourceFace-9722.test.ts` — compile-time identity rows
plus a source-text census whose slices are proven narrower than the files they read, because the
prose that retires each spelling also quotes it.
