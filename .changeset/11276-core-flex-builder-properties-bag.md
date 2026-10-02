---
'@object-ui/core': minor
---

feat(core): the `flex()` builder emits its props in the `properties` bag (objectui#11276)

**BREAKING (output shape):** `flex()` now builds `{ type: 'flex', properties: { direction, justify, align, gap, children } }` instead of writing those keys on the node. That is the spelling `@object-ui/types`' authoring faces accept for an authored `flex` node, which now refuse the flat keys by name (objectui#11276, the maintainer's ruling A on objectui#11300); without this change, `objectui validate` would refuse what the builder builds. The base setters (`id`, `className`, `visible`, `disabled`, `testId`, `visibleOn`) still write on the node. Code that reads a built node's props reads them from `properties` (`flex().direction('col').build().properties.direction`); `build()` is typed `BaseSchema & { type: 'flex'; properties: FlexLayoutProps }`. Rendering is unchanged: `SchemaRenderer` hoists the bag onto the node before the `flex` renderer reads it.
