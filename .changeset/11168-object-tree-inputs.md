---
'@object-ui/plugin-tree': minor
---

`object-tree` publishes the keys its `@objectstack/spec` 17.5.0 row declares and its renderer honours (objectui#11168 slice 3, objectui#11111 decision 3 = B). Each key was measured on the real renderer first.

- `data`, `staticData`, `filter` and `navigation` are now registration inputs on both tags (`object-tree` and `view:tree`). The page validator used to report each as an unknown prop, even though the tree reads it. Each description says what the tree does with the key, including the cases that draw nothing: the `api` and `schema` providers under `data`, and an absent `navigation`. On `navigation`, `page` and a block without `mode` open a record page through the record navigator the host publishes (the console publishes one on its custom pages, record pages and list views). The object is `data.object` when `data` is the object provider, so it wins when both are written, and the tree's `objectName` otherwise. Under a host that publishes none, or on a tree that names neither (inline rows with no `objectName`), they open nothing.
- `objectName` is no longer a required input. The record source is one of `data`, `staticData` and `objectName`. A tree on inline rows never reads the object name, and the validator used to raise `missing-required-prop` on a tree that draws.
- The `tree` input's description now names its four members and what each does.
- `ObjectTree` reads `navigation` without a cast, because the node type declares it.

What the tree draws and what a click opens are unchanged.

⚠️ **Dated note, 2026-10-02 — the `view:tree` tag is retired — objectui#10859.**
Later in this same release objectui#10859 batch 8 unregistered the bare `tree` alias (and with it
`view:tree`), so these inputs ship on one tag, `object-tree`. Author `object-tree`. The rest of this
entry is kept as the reading of this change.
