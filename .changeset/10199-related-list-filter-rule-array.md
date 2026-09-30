---
'@object-ui/types': minor
---

`record:related_list`'s top-level `filter` is declared as the protocol's rule array on
the authoring face, not as `any` (objectui#10199).

`RecordRelatedListComponentProps.filter` mirrored `@objectstack/spec`'s
`RecordRelatedListProps.filter` (declared there as `z.array(ViewFilterRuleSchema)`,
"Additional filter criteria for related records") as `any`. The face an author, or an
AI writing metadata, reads therefore said "anything" for a key the protocol
constrains. It now declares `ViewFilterRule[]`, the same type the interface already
imports for `add.picker.filter` (objectui#9964).

**Breaking for TypeScript authors, released as `minor`** under this repo's
version-alignment rule (the fixed group's major follows `@objectstack`, so a break of
objectui's own surface is declared `minor` with the break spelled out here). Code that
annotates a value with `RecordRelatedListComponentProps` and assigns a non-array
`filter` to it stops compiling: an array of `[field, operator, value]` tuples, an
ObjectQL AST node such as `['and', …]`, a MongoDB-style record, a filter expression
string, or a single rule object outside an array. The protocol's parse already refuses
every one of those shapes on this key, so no metadata that could be published changes
meaning.

Migration: author the rule array, `[{ field, operator, value }]`; the composed node is
runtime-only.

The consumer keeps its wider type on purpose. `@object-ui/plugin-detail`'s
`RelatedList` still declares `ViewFilterRule[] | FilterNode` for the same key, because
`ElementDataSourceGate` writes the composed component-AND-view-AND-binding filter onto
it at runtime, after resolving a `dataSource` binding. That composed node is not an
authorable shape, so the authoring face does not publish it. Nothing changes at
runtime: `any` and `ViewFilterRule[]` are the same bytes, and the gate's write never
went through this interface.
