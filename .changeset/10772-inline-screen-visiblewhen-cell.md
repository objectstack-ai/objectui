---
'@object-ui/app-shell': patch
---

fix(app-shell): the flow inspector's inline `visibleWhen` cell for a screen field reads the screen's declared fields, as the Problems panel and the Debug run do

**What was wrong.** A screen field's `visibleWhen` is bare CEL over the same screen's declared
fields plus `record` (spec `ScreenFieldSpec.visibleWhen`). The Problems panel and the Debug
run's screen step judge the `screen` node's `fields[].visibleWhen` column by that rule
(`screenPredicateRoots` / `screenVisibleWhenScopeError`), but the inline inspector cell for
the same column still read the flow scope. On a sibling-field predicate (`discount > 0`, the
console sample's shape) its inline note read "`discount` is not a reference in scope at this
step"; on a run variable (`needsApproval == true`) it said nothing; and its picker offered the
flow scope (`needsApproval`, `record`, `previous`). It invited an author to rewrite a correct
predicate into one the runner cannot bind. Measured with the real `FlowObjectListField`, the
`screen` node's `fields` columns and the `resolveFlowScope` groups.

**What changed.** That one column now reads the screen's rule; every other expression column
keeps the flow scope.

- The cell is identified by `isScreenVisibleWhenColumn`, the predicate the Problems panel
  already judges the column by (now exported), from the node the inspector passes and the
  list's descriptor id (`FlowObjectListField`'s new `fieldId`, set by `FlowNodeConfigField`
  and never forwarded to a nested list).
- Its picker offers exactly the roots `screenPredicateRoots(node)` admits — the screen's
  declared fields and `record` — under a "Screen fields" section.
- Its inline note is `screenVisibleWhenScopeError`'s: silent on a sibling-field predicate,
  and "`needsApproval` is not a field on this screen" on a run variable, the sentence the
  Problems panel shows for that row. A `{var}` brace is still the brace error, ahead of the
  scope.

No evaluation moved: the runner (`ScreenView`, `FlowRunner`) and the Problems panel's
verdicts are unchanged.
