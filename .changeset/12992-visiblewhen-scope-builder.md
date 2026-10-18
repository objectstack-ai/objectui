---
'@object-ui/react': minor
'@object-ui/components': patch
---

`@object-ui/react` now exports `buildNodeEvaluationScope(predicateScope, boundRecord, pageVariables)`, the one builder of the scope a page node's `visibleWhen` and other values are evaluated against (objectui#12992). It returns four roots: the ambient predicate scope, `current_user` aliased to `user`, the bound row as `record` (only when there is one), and page variables as `page`. `SchemaRenderer` and `evaluateConfigBagInScope` call it as before. `page:tabs` in `@object-ui/components` now calls it for its derived-badge gates and its item-level `visibleWhen` instead of spelling the scope again, so a root added to the builder reaches the tab strip too. No root changes for any caller.
