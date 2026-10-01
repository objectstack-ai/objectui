---
'@object-ui/types': minor
---

`ObjectTreeSchema` mirrors the `object-tree` row of `@objectstack/spec` 17.5.0 (objectui#11168 slice 3). The change applies to both faces, TypeScript and zod.

- `objectName` is optional. The zod face ends in the record-source refinement the map and gantt mirrors carry: a node needs `data`, `staticData` or `objectName`. `objectui validate` used to refuse a `staticData`-only tree with `invalid_type` at `objectName`, even though the tree draws it. It now accepts that tree. A tree with no record source is refused once, at the root, with `RECORD_SOURCE_REQUIRED`. The node's `dataSource` binding does not count, because this block's registration is not gate-wrapped and no binding reaches the tree.
- `data` (`ViewData`), `staticData`, `tree` (the spec's `TreeConfig`, by reference) and `navigation` (the spec's `NavigationConfig`, by reference) are declared.

⚠️ This narrows what is accepted. Until now these keys rode the node's passthrough, so any value was accepted. Each is now judged:
- a bare array under `data` is a type error;
- a misspelled member inside `tree` is refused;
- an unknown `navigation.mode` is refused.

The fixed group ships the change as `minor`.
