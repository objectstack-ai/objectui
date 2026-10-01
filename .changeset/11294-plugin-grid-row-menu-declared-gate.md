---
'@object-ui/plugin-grid': patch
---

fix(plugin-grid): a grid row shows an action whose `visible` is blank, as the action's toolbars do

`RowActionMenu` kept its own copy of `isCustomRowActionVisible`, and the copy
decided whether a row action declared a `visible` gate with a test of its own
(`null` or `''`). A whitespace-only `visible`, or an envelope whose `source` is
blank, counted as declared, was evaluated, and failed closed, so the action was
missing from every row.

The copy is gone. `RowActionMenu` reads `isCustomRowActionVisible` from
`@object-ui/components`, which asks `hasDeclaredVisibilityGate`, the action
family's one definition:

- A blank `visible` is no gate: the inline primary button and the "⋮" item
  render, and the row keeps its "⋮" trigger. The blank is still reported once
  (ADR-0137 D4).
- `visible: false` still hides the action, and a CEL string is still evaluated
  against the row with the object's field definitions, failing closed on a
  fault.
- A value that is not a predicate at all (`0`, `{}`) is no gate. It used to
  hide the action.
