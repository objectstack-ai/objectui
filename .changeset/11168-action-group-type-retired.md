---
'@object-ui/types': minor
---

**Breaking (types only):** the `ActionGroup` interface is removed from
`@object-ui/types` (objectui#11168, slice 2). Nothing in this repository
imported it.

It was not the type of the `action:group` block, and it disagreed with that
block's `@objectstack/spec` row on six counts:

- it required `name`, which the row refuses and which `action:group` no
  longer publishes;
- it required `label` and `actions`, which the row makes optional;
- it typed `visible` as a string only;
- it lacked `location`, `variant` and `size`.

To type an `action:group` node, use `ActionGroupBlockSchema` from
`@object-ui/types/zod` (the spec row by reference), or `ActionGroupProps` from
`@objectstack/spec/ui` for its `properties` bag. Released as `minor`, per this
repository's version-alignment rule for the fixed package group.
