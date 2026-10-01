---
'@object-ui/plugin-tree': minor
---

`object-tree` publishes the keys its `@objectstack/spec` 17.5.0 row declares and its renderer honours (objectui#11168 slice 3, objectui#11111 decision 3 = B). Each key was measured on the real renderer first.

- `data`, `staticData`, `filter` and `navigation` are now registration inputs on both tags (`object-tree` and `view:tree`). The page validator used to report each as an unknown prop, even though the tree reads it. Each description says what the tree does with the key, including the cases that draw nothing: the `api` and `schema` providers under `data`, and an absent `navigation`, `page` or a block without `mode` on a standalone tree.
- `objectName` is no longer a required input. The record source is one of `data`, `staticData` and `objectName`. A tree on inline rows never reads the object name, and the validator used to raise `missing-required-prop` on a tree that draws.
- The `tree` input's description now names its four members and what each does.
- `ObjectTree` reads `navigation` without a cast, because the node type declares it.

What the tree draws and what a click opens are unchanged.
