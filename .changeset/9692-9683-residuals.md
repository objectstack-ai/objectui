---
---

Close the post-PASS residuals of objectui#9683 inside `@object-ui/types`'s test
surface (objectui#9692): widen the `WalkableDef` null-mint matrix to every node
kind either walker names, derive the swept member list from `keyof WalkableDef`
so an added member cannot be dropped silently, pin the import boundary's
`unchanged` comparison as STRICT at source level, and retire the three
module-local def mirrors in favour of the shared declaration. Test surface and a
pending changeset's prose only; no package is released by this change.
