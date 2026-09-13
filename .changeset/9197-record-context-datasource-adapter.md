---
'@object-ui/react': minor
'@object-ui/plugin-detail': minor
'@object-ui/app-shell': minor
'@object-ui/components': minor
'@object-ui/console': minor
---

**BREAKING** — `RecordContextValue.dataSource` is the DataSource **adapter** it
has always held, not a datasource id string.

**FROM** `dataSource: 'ds_primary'` **TO** `dataSource: myAdapter` (any
`DataSource` from `@object-ui/types`).

```ts
// before — compiled, but no producer ever did this and no reader could use it
const ctx: RecordContextValue = { objectName: 'account', recordId: 'r1', dataSource: 'ds_primary' };
// after
const ctx: RecordContextValue = { objectName: 'account', recordId: 'r1', dataSource: myAdapter };
```

The member was declared `dataSource?: string` — "an optional datasource id;
mirrors the page-level datasource override" — while the one production host
that writes it (`@object-ui/app-shell`'s `RecordDetailView`) forwards an adapter
OBJECT and every reader calls adapter methods on it. Measured on the base tree:
of the provider sites in this repository that write the member, exactly one is
non-test and it passes the adapter; the only in-repo writer of a string was a
test fixture, which existed because the declaration invited it. So the id was
never a contract anyone kept — it was a statement the code contradicted at every
site, and the override it described has zero producers. Contract-first
(Commandment #0.1): the declaration moves to what the code holds, and no second
`dataSourceId` member is minted for a requirement nobody implements.

What it bought: each reader paid for the wrong declaration with a cast at the
point of use, and a cast deletes the compiler's answer to "does this adapter
have the method I am about to call". All 11 record-context read sites are now
cast-free, across `@object-ui/app-shell`, `@object-ui/components` and
`@object-ui/plugin-detail`. The worked instance is objectui#8883's reference
rail: it reaches `dataSource.getObjectSchema` — a REQUIRED member of
`DataSource` — and now gets that guarantee from the compiler instead of from
`(ctx as any)`.

⚠️ Nothing to migrate at runtime and no data change: every producer already
passed the adapter, so no value moving through this member changes. A
TypeScript consumer outside this repo that read the member as `string` is not
observable from here and gets a compile error (TS2322) naming the key — which
is why the FROM/TO is spelled out above. Re-widening to `string | DataSource`
would not be a kindness: a union member without `getObjectSchema` cannot be read
without narrowing, so it re-breaks every reader this change repaired. Both
directions are pinned against the real compiler in
`RecordContext.dataSourceType.pin.test.ts`.

⚠️ `SchemaRendererContextValue.dataSource` one context over is a **different**
declaration (`any`) and is **not** touched here. Five `as any` reads in
`@object-ui/fields` key off that context, not this one; they are unaffected by
this change and are reported separately.

objectui#9197.
