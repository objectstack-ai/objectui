---
'@object-ui/react': minor
---

`SchemaRenderer` no longer reads a page component's `visibility` key (objectui#12654). `@objectstack/spec` 18 retires it as a `retiredKey` tombstone naming `visibleWhen` (objectstack#23543 F4), so `visibleWhen` is the one conditional-visibility key the renderer reads for it.

What a raw schema loses: a node handed straight to `SchemaRenderer`, without passing through the spec's parse, that carries only `visibility: 'PREDICATE'` is no longer hidden when the predicate is false; it now draws, and the `visibility` value is no longer stripped before the component's props. Write `visibleWhen` instead. The `SchemaRenderer` working-copy type no longer declares `visibility`.

What is unaffected: metadata served by an ObjectStack runtime. A served page row already reaches the renderer with `visibleWhen`: the spec's parse folds the old key through the 18 pre-releases, and spec 18's stored-row rehydration rewrites a row stored with it. `BaseSchema`'s own deprecated `visibleOn` is a different key and is still read.
