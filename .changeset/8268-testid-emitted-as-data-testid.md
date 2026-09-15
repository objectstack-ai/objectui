---
'@object-ui/react': minor
'@object-ui/types': patch
---

`BaseSchema.testId` is now emitted as `data-testid` (objectui#8268, ADR-0049 enforce arm).

The declaration promised "Rendered as data-testid attribute" and nothing rendered it. `testId`
was absent from `SchemaRenderer`'s metadata destructure, so it fell through into the spread and
reached the DOM under React's fallback spelling for an unrecognised prop — a non-standard
lowercase `testid` that `screen.getByTestId(...)` and `[data-testid=...]` both miss. The
validator accepted the key, so an author who followed the documented row got a failing test with
no diagnostic near the cause.

Measured on `93127bd6f` through the real `ui:scroll-area` renderer, node
`{ id: 'my-scroll', testId: 'my-tid' }`:

```
before  id="my-scroll" testid="my-tid" data-obj-id="my-scroll"
        [data-testid="my-tid"] false · [testid="my-tid"] true
after   id="my-scroll" data-testid="my-tid" data-obj-id="my-scroll"
        [data-testid="my-tid"] true  · [testid="my-tid"] false
```

`id` reaching the DOM as `id` + `data-obj-id` is the contrast leg, green on both runs — the
strip list and the spread were working as designed; only this key had no mapping.

The other direction — retiring the promise — was considered and declined. It is what
objectui#7088 did for `BaseSchema.hidden`, but that key had a working behaviour to describe and
zero named consumers, and the ruling's decline turned on exactly that. This promise already has
carriers outside the type declaration: `content/docs/api/schema-reference.md` states it as a
table row and authors `testId` in that page's own base-schema example, `@object-ui/cli`'s
`OBJECTUI_STRUCTURAL_KEYS` identifies a file as an ObjectUI schema node by this key,
`ObjectGridSlotKey` / `ObjectFormSlotKey` pin it, `SchemaBuilder.testId()` writes it, and
ADR-0054 C4 — shipped — reads "the renderer emits `data-testid` … derived from metadata".

`minor`, not `patch`: nodes that author `testId` change what they emit in both directions, so a
selector written against the accidental `[testid=…]` stops matching.

Nodes that author no `testId` are byte-identical to before. The attribute is spread
conditionally rather than passed as `'data-testid': undefined`, because the unconditional form
puts the key in every node's props bag and a component that sets its own `data-testid` before
spreading what it is handed loses its locator — measured, 9 tests red across 5 files, three of
them the byte-for-byte props-bag pins (objectui#6708 / #6752 / #6760).

`testId` is stripped from the spread but kept in objectui#4795's unevaluated-expression scan
set: the strip list is that diagnostic's exclusion list because every other member holds raw
predicate source, and this key holds a literal.
