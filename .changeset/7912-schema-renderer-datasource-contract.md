---
'@object-ui/react': minor
'@object-ui/components': minor
'@object-ui/fields': minor
'@object-ui/plugin-list': minor
'@object-ui/plugin-calendar': minor
'@object-ui/plugin-gantt': minor
'@object-ui/plugin-kanban': minor
'@object-ui/plugin-charts': minor
'@object-ui/plugin-dashboard': minor
'@object-ui/plugin-detail': minor
---

**BREAKING** — `SchemaRendererProvider`'s `dataSource` prop, and the context
type every `useSchemaContext()` consumer reads back, are the published
`DataSource` contract instead of `any`.

**FROM** `dataSource={anything}` **TO** `dataSource={adapter}` — a `DataSource`
from `@object-ui/types`, or `null` / `undefined` when the host has no adapter
bound.

```ts
// before — compiled, and failed at runtime on the first find()
<SchemaRendererProvider dataSource={'not-an-adapter'}>
// before — compiled, and no reader can do anything with it
<SchemaRendererProvider dataSource={{}}>
// after
<SchemaRendererProvider dataSource={adapter}>       // a DataSource
<SchemaRendererProvider dataSource={undefined}>     // "I have no adapter"
```

Both sites are typed `DataSource | null | undefined` — the spelling
`useSettledSchema` in this same package already used. The two absences are part
of the contract, not a weakening of it: a Studio preview, a `kind:'react'` page
rendered before the host's adapter connects, and a widget probe driving
`apiFetch` alone all render with nothing bound, and every reader in the tree
already guards for it. What the union refuses is everything that is not an
adapter: a string, an empty object, a plain data bag, a partial adapter missing
a required member.

The measured cost, both halves, because the two `any`s have different blast
radii (measured separately on `origin/main`, whole-repo type-check over the 33
packages that depend on `@object-ui/react`):

- the **context type** — the `any` that reaches every `useSchemaContext()`
  reader — reds **7 diagnostics at 7 sites in 4 packages**, all of them
  production code or a mocked module factory.
- the **provider prop** — the injection points — reds **52 diagnostics at 27
  sites in 11 packages**, all but one of them test doubles.

That ordering is the reverse of the prediction on the card: the context `any`
was expected to be the expensive one because it infects the whole tree, and it
is the cheap one, because every reader in the tree already guarded and none of
them ever reached past `find` / `getObjectSchema`. The prop is the expensive
one, because the injection points are overwhelmingly test doubles that were
never complete adapters. The full accounting is on objectui#7912.

Two runtime behaviours change, both in the "no adapter" direction and both
strictly closer to what the surrounding code already intended:

- `@object-ui/components`' `kind:'react'` page passed an empty object as its
  "no adapter yet" stand-in. An empty object is TRUTHY, so it walked past every
  `if (!dataSource)` guard written to catch exactly that state and failed later,
  at the call. It now passes the absent adapter itself, so the guard fires where
  it was meant to. The module-constant identity that stand-in existed for is
  preserved: `null` is a primitive, so the provider's memo is unaffected.
- `@object-ui/plugin-calendar`, `@object-ui/plugin-gantt` and
  `@object-ui/plugin-kanban` collapse a `null` adapter from the context to
  `undefined` before handing it to their widget, whose prop declares the single
  spelling `dataSource?: DataSource`.

Nothing else moves at runtime: no value flowing through this key changes, and
no data path is touched. A TypeScript consumer outside this repo that handed
this prop something other than an adapter now gets a compile error naming the
key (TS2322 / TS2739 / TS2740), which is why the FROM/TO is spelled out above.

Five `as any` reads of this context in `@object-ui/fields` are gone — they were
redundant the moment the seam became honest — and `LookupField`'s local
re-declaration of the imported context as a `Context` of `any`, which laundered
its `dataSource` read while looking typed, is gone with them. Both directions of
the contract are pinned against the real compiler in
`SchemaRendererContext.dataSourceType.pin.test.ts`, and the card's planted
documentation probe (a bare string in `packages/react/README.md`'s provider
example) now fails `pnpm check:doc-snippets`, where it used to exit 0 with zero
diagnostics.

objectui#7912.
