---
---

Tests only, no package released (objectui#10872, batch 7). A new pin in `@object-ui/components`,
`page-container-bag-children-10872.test.tsx`, mounts `page:card`, `page:section`, `page:footer` and
`page:sidebar` through the real `SchemaRenderer` and registry with two distinct children in
`properties.children`. It asserts that both render inside the container's own element, in the order
written. The controls are the same containers with no children and with an empty
`properties.children`: each renders its empty element and no child content.

Batch 6 made `properties.children` the only child-list spelling the zod faces accept on these four
containers. It measured the runtime half once, with a probe it did not commit. This file is that
probe, committed. No renderer, schema or published file changes.
