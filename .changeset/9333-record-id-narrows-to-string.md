---
'@object-ui/types': minor
'@object-ui/react': minor
'@object-ui/core': minor
'@object-ui/plugin-form': patch
'@object-ui/data-objectstack': patch
'@object-ui/plugin-grid': patch
---

A record id is a `string` everywhere in the published types, as
`@objectstack/spec` has always declared it. Three published declarations that
admitted `number` no longer do.

⚠️ **BREAKING if your code hands a numeric primary key to any of these three:**

- **`RecordContextValue.recordId`** (`@object-ui/react`) — the value
  `useRecordContext()` gives you is now a `string`, never a `number`.
- **`DataSource.update`'s `id` parameter** (`@object-ui/types`) — a call that
  passes a `string | number` is now a type error. Adapters that *implement*
  `DataSource` are unaffected (see Migration).
- **`TransactionOperation.id`** (`@object-ui/core`) — the operation record you
  hand to `TransactionManager.recordOperation()` must carry a `string` id. If
  you build that object from a numeric key, convert it where you build it. This
  type is exported from the package root, so this is a breaking change for
  `@object-ui/core` consumers in its own right, not just a knock-on.

Ships as `minor` per the launch-window convention: objectui's
`major` is a cross-repo pin to `@objectstack`'s so that "same major means
compatible" holds across the two repos
(`scripts/check-changeset-no-major.mjs`), and objectui's own breaking changes
ship as `minor` with the break named where it lands — this entry is the channel
that carries it.

## What changed

- `RecordContextValue.recordId` (`@object-ui/react`) was
  `string | number | null | undefined`; it is now `string | null | undefined`.
- `DataSource.update`'s `id` parameter (`@object-ui/types`) was
  `string | number`; it is now `string`.
- `TransactionOperation.id` (`@object-ui/core`) was `string | number`; it is now
  `string`. Its sibling `BatchTransactionOperation.id` was already a `string`,
  so the two operation records finally agree.
- `LineItemsPanel` (`@object-ui/plugin-form`) drops the type assertion
  objectui#9304 left on its parent id. That assertion was the only thing making
  the context declaration and `buildMasterDetailEditBatch(parentId: string)`
  meet; the declaration now does it, so the evidence is discharged.

## Why the protocol, and not a wider consumer type

`@objectstack/spec` declares a record id as `z.string()` on every record door —
get, update, delete and the batch operation. A consumer type may not be wider
than the protocol: a declaration that admits `number` promises callers something
the wire never carries, and the promise is kept only by an assertion at the far
end, which is what this card was filed about.

## Internal consumers repaired at the same time (no public contract moves)

Narrowing an interface **parameter** never reaches implementors — TypeScript
compares method parameters bivariantly, so an adapter that still declares
`id: string | number` keeps satisfying `DataSource`. It reaches **callers**. A
full local type-check of every workspace type-check program found exactly six,
in three packages, and each was red because a further declaration one layer in
was itself wider than the protocol. All three are narrowed here, types only, with
no runtime change and no coercion added at any call site:

- `UserPreferenceRecord.id` and the `cachedRowId` it feeds
  (`@object-ui/data-objectstack`) are `string`. Module-local, not published —
  these rows are read back off the protocol, so the union was a claim the wire
  never makes.
- `resolveRecordId`'s return type (`@object-ui/plugin-grid`) is
  `string | undefined`. Module-local, not published — it annotates `any`-typed
  row data, so the union was an assertion rather than a measurement.

## Migration — no `String(...)` at your call sites

`RecordContextProvider` still **accepts** `string | number | null | undefined`
and narrows it once, itself. A host that mounts a record with a numeric primary
key therefore changes nothing: the conversion is paid at that injection
boundary, typed, in one place. Consumers of `useRecordContext()` read a
`string`.

`DataSource` implementors are unaffected — TypeScript compares method parameters
bivariantly, so an adapter that still declares `id: string | number` continues
to satisfy the interface. What changes is the **caller** side: a call that passes
a `string | number` to `dataSource.update` is now a type error. A backend whose
primary keys are numeric maps them at its own adapter boundary rather than
pushing the union through every caller.

For `TransactionOperation`, the same rule applies one level up: build the
operation record with a `string` id. If the id arrives from a numeric-keyed
backend, convert it in your adapter — the one place that knows the backend's key
type — rather than at each `recordOperation()` call. Nothing about this change
alters what is sent over the wire; only the declarations moved.
