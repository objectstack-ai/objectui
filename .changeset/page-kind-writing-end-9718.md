---
---

Test-only and comment-only change in `@object-ui/app-shell`; no published behaviour changes.

The comment above `PageView`'s page-kind to node-type mapping claimed that changing the
mapping would turn `page-kind-node-type-channel-9642` red. It would not: that pin lives in
`@object-ui/components`, which does not depend on `@object-ui/app-shell`, so its module graph
cannot reach `PageView`. Measured both directions — gutting the mapping left that pin green,
deleting the `utility` registration turned it red — so it guards the reading end only.

The writing end now has its own pin, `page-kind-writing-end-9718`, in app-shell's
`views/__tests__`; it renders `PageView` over a stored document of each `PageTypeSchema` kind
and asserts the node type written. The comment now says which pin answers for which end.
