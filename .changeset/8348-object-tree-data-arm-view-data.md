---
'@object-ui/core': minor
'@object-ui/plugin-tree': minor
---

**Breaking behaviour change — `object-tree` now honours only the `data` spelling its published row declares.**

Decision batch #83, maintainer verbatim 「8348 以协议为准」: a view block honours the `data` spelling its block's published row declares, and no other. `object-tree` was the one ladder block that ruling could not reach, because no published face declared a `data` row for it, so it honoured ANY truthy `data`. Ruling batch #136 item 3 (Q1-C) had the protocol gain the row, and `ComponentPropsMap['object-tree']` in the installed `@objectstack/spec` declares `data` as the `ViewData` union and `staticData` as an array. The ruling's 「协议没有的能力删」 clause did not fire — the row does declare `data` — so the tree keeps the object form and loses only the bare-array spelling.

- `data: { provider: 'value', items: [...] }`, `{ provider: 'object', object }` and `{ provider: 'api', … }` — **unchanged**, still the tree's first record source.
- `staticData: [...]` — **unchanged**; the same row declares it, and it is still the second rung.
- ⚠️ `data: [...]` (a bare array) — **no longer a record source.** The ladder falls through to `staticData`, then `objectName`: such a tree queries its object instead, or draws `No records` when it names neither. In a development build `SchemaRenderer` says so once, naming the key and the spelling that works; in production it is quiet. This is the same outcome `object-map` and `object-gantt` already give for the same spelling. Stored documents authored that way stop drawing those rows — accepted by the ruling, with no transition window. Move inline rows to `staticData` or to `data: { provider: 'value', items }`.
- The `data` **prop** a host hands down (`ListView`'s tree) is untouched.

Two carriers had to close for this to be observable. `@object-ui/core`'s `recordSourceDataArmForType` now answers `'view-data'` for all four spellings the tree registers under (`object-tree`, `plugin-tree:object-tree`, `tree`, `view:tree`), so `SchemaRenderer` no longer spreads an authored `data` on a tree node as a React prop (objectui#9571). And `ObjectTree`'s own fetch effect no longer reads `schema.data` beside the host prop — that second reader bypassed the shared ladder, so an arm change alone would have removed nothing end to end.
