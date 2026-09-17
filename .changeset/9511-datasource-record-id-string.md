---
'@object-ui/types': minor
'@object-ui/react': minor
---

**BREAKING if your code hands a numeric primary key to one of these four** — a
record id at the `DataSource` boundary is a `string`, as `@objectstack/spec`
declares every record door (objectui#9511, director batch #136 item 5 letter B).
objectui#9333 narrowed `DataSource.update`; this entry closes three more doors
and the one consumer declaration that fed them.

## What changed

- **`DataSource.delete`'s `id` parameter** (`@object-ui/types`) — was
  `string | number`, now `string`.
- **`DataSource.bulkUpdate`'s `ids`** (`@object-ui/types`) — was
  `ReadonlyArray<string | number>`, now `ReadonlyArray<string>`.
- **`DataSource.bulkDelete`'s `ids`** (`@object-ui/types`) — same narrowing.
- **`UseViewDataResult.fetchOne`** (`@object-ui/react`) — was
  `(id: string | number) => Promise<T | null>`, now `(id: string) =>
  Promise<T | null>`. This hook hands its argument straight to
  `DataSource.findOne`, so the union it admitted was a claim the protocol never
  made. Exported from the package root, so it is a break for
  `@object-ui/react` consumers in its own right, not a knock-on.

The `DataSource` docblock now states the rule once, for the whole interface,
so a reader who meets one method does not have to re-derive it from another.

## Migration

Convert where you build the id, not at each call:

```ts
// before
await dataSource.delete('accounts', row.id);            // row.id: number
await dataSource.bulkDelete?.('accounts', selectedIds); // number[]

// after
await dataSource.delete('accounts', String(row.id));
await dataSource.bulkDelete?.('accounts', selectedIds.map(String));
```

Adapters that **implement** `DataSource` are unaffected: TypeScript compares
method parameters bivariantly, so an adapter still declaring `string | number`
continues to satisfy the interface. The narrowing binds callers.

## Disposition

**Disposition: no ADR-0087 conversion — nothing authored moves.** The change is
on the TypeScript call face only. No zod accept-set narrows, so every metadata
document that validates today still validates, and there is no old shape for a
conversion layer (ADR-0087 D2) to accept and rewrite, nor a metadata migration
step (D3) to replay. What moves is what a numeric-primary-key host sends on the
wire for these three methods: `'42'` where it sent `42`, consistently with
`update`. The conversion lives in one typed place — the host's own adapter
boundary — rather than in a union carried by every caller.

Ships as `minor` per the launch-window convention: objectui's `major` is a
cross-repo pin to `@objectstack`'s so that "same major means compatible" holds
across the two repos (`scripts/check-changeset-no-major.mjs`), and objectui's
own breaking changes ship as `minor` with the break named where it lands.

## One door is deliberately still open

`DataSource.findOne` keeps `string | number` in this release. Narrowing it is
ruled, but its remaining call sites split two ways. `ObjectForm` reads
`ObjectFormSchema.recordId` and `DetailView` reads `DetailViewSchema.resourceId`
— **authorable** metadata keys whose zod mirrors accept a number today, so
narrowing either refuses author JSON that validates now. `DrawerForm`,
`ModalForm`, `SplitForm`, `TabbedForm` and `WizardForm` read a `recordId`
declared on their own exported schema face; those faces have no zod mirror and
no registered node type, so they are TypeScript-only, like
`UseViewDataResult.fetchOne` above — but they still cannot narrow first,
because `ObjectForm` builds all five of them from its own authorable
`ObjectFormSchema` and the refusal simply moves to those hand-off sites.

So the choice is either an authoring-face narrowing or a reader-side
conversion; neither is named by the ruling, and it is carried on objectui#9511.
The reason is recorded in the `DataSource` docblock so it is not rediscovered.
