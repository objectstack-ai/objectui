---
'@object-ui/types': minor
---

**BREAKING** — `RecordHighlightsComponentProps.layout` no longer offers `grid`.

**FROM** `layout: 'grid'` **TO** `layout: 'horizontal'` (the schema default) or
`layout: 'vertical'`.

```ts
// before — compiled here, refused at publish
const props: RecordHighlightsComponentProps = { fields: ['name'], layout: 'grid' };
// after
const props: RecordHighlightsComponentProps = { fields: ['name'], layout: 'horizontal' };
```

`@objectstack/spec` declares this key as
`z.enum(['horizontal','vertical']).default('horizontal')` — a closed set of
**two**. This type declared three, so `{ layout: 'grid' }` type-checked locally
and the contract refused the document at publish with `invalid_value` at
`layout`. Re-measured on the installed pin, `@objectstack/spec` 17.4.0, against
two controls that fire on the same instrument: an arbitrary value is refused
with the same code (so `grid` was never special-cased), and omitting the key
parses green and takes the default (so the schema is not refusing everything).
Contract-first (Commandment #0.1): the declaration moves to the contract, and
the spec is not widened.

Nothing to migrate at runtime, and no data change: `RecordHighlightsRenderer`
reads no `layout` at all, and `@object-ui/plugin-detail`'s registry manifest
already published this input as `type: 'enum', enum: ['horizontal', 'vertical']`
— the published TypeScript face was the only layer that offered the third
value, and it only ever reached an author who wrote `grid` exactly.

⚠️ The census behind this narrowing covers this repository only, and **it found
no in-repo authoring to migrate**: every in-tree `layout: 'grid'` belongs to a
different component (`detail-view` in `content/docs/api/schema-reference.md` and
`phase2-schemas.test.ts`, `ai-recommendations` in `packages/plugin-ai/README.md`),
and the one in-repo consumer of this interface that writes a `layout`
(`p1-spec-alignment.test.ts`) writes `'horizontal'`. So no document in this
repository stops type-checking. A TypeScript consumer outside this repo that
wrote `grid` is not observable from here and gets a compile error (TS2322)
naming the key — which is why the FROM/TO is spelled out above.

⚠️ The `layout` one interface up, on `RecordDetailsComponentProps`, is a
**different** divergence and is **not** touched here: the contract refuses that
key by name, and its removal is objectui#9040's, still open. Copying either
declaration onto the other is refused at publish. The union landed here is
pinned against the installed spec — in both directions, and with the sibling as
a firing control — in `record-highlights-layout-9187.test.ts`.

objectui#9187.
