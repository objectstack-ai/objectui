---
'@object-ui/types': minor
'@object-ui/plugin-tree': minor
---

`ObjectTreeSchema.filter` is declared on both faces, in the shape objectui#9309
settled for `ObjectGallerySchema.filter`: `QueryParams['$filter']` by indexed
access on the TS interface in `objectql.ts`, and the same two-arm union (array
first) on the zod mirror in `zod/objectql.zod.ts` (objectui#9549).

The key was already delivered and read before it was declared. `ListView` puts
`filter` on the `baseProps` every child view receives, and `ObjectTree` sends
`$filter: schema.filter` on its own fetch. Until now the value survived only on
`BaseSchema`'s `[key: string]: any` and the mirror's `.passthrough()`.

Accept-set change on the published surface, stated plainly:

- NARROWS, both faces. `filter: 'stage=won'` and `filter: 42` are type errors
  now, and the mirror refuses them at parse time instead of keeping them
  unjudged. Breaking for any TypeScript consumer that assigned a non-object
  value to this key on an `object-tree` node.
- Both object arms still compile and parse: the ObjectQL field-keyed record
  (`{ age: { $gt: 18 } }`) and the spec's `FilterArray` sugar
  (`[['status', '=', 'active']]`).

`@object-ui/plugin-tree`: the renderer no longer reads the tree block from
`filter.tree`. It used to resolve the block as `schema.tree`, falling back to a
`tree` member of `schema.filter`; that second dialect treated the query filter
as a holder of tree config. Measured before removal: no example, fixture, test
or doc authors a `tree` under `filter`, and the arm dates from the renderer's
first commit with no stated reason. Author the block as `tree`. A node that put
it under `filter` now gets the auto-detected parent field and the default label
column, and the `filter` object is still forwarded as `$filter`.
