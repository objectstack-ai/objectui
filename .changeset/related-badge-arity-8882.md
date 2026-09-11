---
'@object-ui/core': minor
'@object-ui/components': minor
'@object-ui/plugin-detail': minor
---

fix(related-list): the tab badge compiles its parent scope by relationship ARITY, like the rows

A related list on a `multiple: true` relationship rendered its rows above a tab
with no count at all. The row query has compiled the parent-relationship
condition to match the field's arity since objectui#7299 (`$contains` for a
multi-value relationship, `=` for a single-value one), but the badge's count
probe carried a second compiler that always sent bare equality — which the
driver refuses on an array-valued column, and the count store swallows the
refusal without caching anything.

Rather than teaching the second compiler the same rule, there is now one:
`@object-ui/core` exports `composeParentScopeFilter` (and the
`isMultiValueRelationship` verdict behind it), and both the row query and the
badge probe call it. The arity verdict remains `@objectstack/spec/data`'s own
`isMultiValueField`, so the renderer and the driver that executes the query
still decide on the same rule.

`RelatedCountStore.fetch` takes the child object's field defs as a new optional
last argument; callers that cannot see metadata keep the previous equality
wire, byte for byte. Single-value related lists are unchanged on both sides.
