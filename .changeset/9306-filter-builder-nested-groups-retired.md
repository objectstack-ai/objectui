---
'@object-ui/types': minor
---

feat(types)!: a `filter-builder` group is flat — a nested sub-group, `allowGroups` and `maxDepth` are retired and refused by name (objectui#9306)

⚠️ Breaking, marked `minor` under this repo's version-alignment rule (a `major`
in the fixed group would move all of it off the `@objectstack` major). A
`filter-builder` node whose group nests a sub-group, or that authors
`allowGroups` or `maxDepth`, now FAILS to validate, and a TypeScript literal
that does either no longer compiles.

Both published faces declared nesting that nothing honoured.
`FilterGroup.conditions` was `(FilterBuilderCondition | FilterGroup)[]`, its zod
mirror `FilterGroupSchema` took the same union, and `FilterBuilderSchema`
declared `allowGroups` (documented default `true`) and `maxDepth` (documented
default `3`). `FilterBuilder` draws every entry of `conditions` as one flat
field / operator / value row and has no control that creates a group. So a
sub-group validated green, drew as a row with blank field and operator
triggers, and its own conditions were shown nowhere; no renderer read either
switch. The maintainer's ruling on objectui#9306 (「A 撤掉嵌套声明」) retires the
nesting at the declaration rather than narrowing it at a consumer.

- `FilterGroup.conditions` is now `FilterBuilderCondition[]`.
- `FilterGroupSchema` judges each entry as a row, and an entry that carries its
  own `conditions` is refused by name: ONE `custom` issue at the entry's own
  path (`value.conditions.N` on a `filter-builder` node), whose message says the
  sub-group is retired and what to write instead. That message is also the
  published description of `conditions`.
- `allowGroups` and `maxDepth` are `?: never` tombstones on the TypeScript face
  and `retirementTombstone()` arms on the mirror: an `invalid_type` issue at the
  key. They stay declared because the node is `.passthrough()`, so a deleted
  key would have been kept in silence.
- `FilterGroupSchema` no longer names itself, so its `z.lazy` is memoised like
  `FilterBuilderConditionSchema`'s: `FilterGroupSchema.unwrap()` is now
  reference-stable. Its public type is unchanged.
- The `filter-builder` docs page drops the nested group, the two keys and the
  "nested conditions" promise, and says why.

**Migration:** write the sub-group's rows into the one group (its `logic`
combines all of them) and remove `allowGroups` / `maxDepth`. A filter that
needs a different `logic` per sub-group cannot be expressed by this component,
and never could be: it rendered such a filter as a blank row. Whether stored
tenant metadata carries nested groups was NOT measured (it cannot be read from
this repository); any that does renders blank today and is refused on its next
validation or save.

Pinned in `packages/types/src/__tests__/filter-builder-nested-group-retired-9306.test.ts`.
