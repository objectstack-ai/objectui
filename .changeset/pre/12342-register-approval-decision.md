---
'@object-ui/app-shell': minor
'@object-ui/types': minor
'@object-ui/cli': patch
---

The page block `record:approval_decision` renders (objectui#12342). `@objectstack/spec` 18 declares it, and until now a page naming it passed the spec and drew nothing, because no registration mounted the decision panel.

- **Registered (`@object-ui/app-shell`).** The package entry registers `ApprovalDecisionRenderer` as `record:approval_decision` (no bare twin), from the new side-effect leaf `views/record-approval-decision-renderer.tsx`, which joins the package's `sideEffects` array. On an approval request's record page the node draws the request's decision progress above its declared decision actions; off a request page it draws the localized notice it already drew. The renderer is still not exported from the package entry: a page reaches it by type.
- **Armed (`@object-ui/types`).** `RecordApprovalDecisionBlockSchema` (zod, from `@object-ui/types/zod`) and its TypeScript twin of the same name (from `@object-ui/types`) are new, and `AnyComponentSchema` gains the arm, so `safeValidateSchema` and the strict face accept a `record:approval_decision` node. Its `properties` bag is the spec's empty strict row, restated because the spec exports the row under no name: the only bag it accepts is `{}`, and a node-level `children` or `body` is refused by name.
- **`objectui check` and `objectui validate` (`@object-ui/cli`).** The generated list of registered types gains `record:approval_decision`, and `objectui validate` no longer refuses the type at `type`.

Studio's block palette still does not offer the block; its exclusion reason now says it renders.
