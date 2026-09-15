---
'@object-ui/types': minor
---

**BREAKING** — the body-wide `RecordDetailsComponentProps.columns` is the
contract's string enum, not a number.

**FROM** `columns: 2` **TO** `columns: '2'`.

```ts
// before — compiled here, refused at publish
const props: RecordDetailsComponentProps = { columns: 2 };
// after
const props: RecordDetailsComponentProps = { columns: '2' };
```

`@objectstack/spec` declares the top-level key as
`z.enum(['1','2','3','4']).default('2')` — a closed set of **string** literals.
This type declared `columns?: number`, the wrong primitive type rather than
merely a wider range, so `{ columns: 2 }` type-checked locally and the contract
refused it at publish with `invalid_value` at `columns`. Measured on the
installed pin, `@objectstack/spec` 17.4.0, against a control that fires on the
same instrument: `{ columns: '2' }` parses green and its value survives; the
declaration is byte-identical to the 17.3.0 the card was filed against.
Contract-first (Commandment #0.1): the code moves to the contract's spelling,
and the spec is not widened.

⚠️ `sections[].columns` one level down is **unchanged and stays `number`**. The
per-section key is `z.number().int().min(1).max(4)`, so a section takes `2` and
refuses `'2'` — exactly inverting the body-wide key. The same word names two
different types one level apart, which is why this is not a sweep: copying
either declaration onto the other is refused at publish, in one direction or
the other. Both levels, and their non-equality, are pinned against the installed
spec in `record-details-columns-8604.test.ts`.

⚠️ The census behind this narrowing covers this repository only: one in-repo
call site wrote the number (`p1-spec-alignment.test.ts`), and it is corrected in
the same change. A TypeScript consumer of `@object-ui/types` outside this repo
that wrote `columns: 2` is not observable from here and gets a compile error
(TS2322) naming the key — which is why the FROM/TO is spelled out above. Nothing
to migrate at runtime: the renderer passes the authored value straight through,
and the registry manifest (`@object-ui/plugin-detail`) already published this
key as `type: 'enum', enum: ['1','2','3','4']`, so the published TypeScript face
was the only layer that disagreed.

objectui#8604.
