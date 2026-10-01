---
'@object-ui/components': minor
---

fix(components): a related list's row menu shows an action whose `visible` is blank, as its toolbar does

The data table's row menu decided whether a custom row action declared a
`visible` gate with a test of its own (`null` or `''`). A whitespace-only
`visible`, or an envelope whose `source` is blank, counted as declared, was
evaluated, and failed closed. So one action showed in a related list's
toolbar and was missing from its rows, whether it reached the rows through
`record_related` or `list_item`.

`isCustomRowActionVisible` now asks `hasDeclaredVisibilityGate`, the one
definition the rest of the action family asks (objectui#3812):

- A blank `visible` (`''`, whitespace, or an envelope with a blank `source`) is
  no gate, so the action shows in the row menu and counts toward the row's "⋮"
  trigger. The blank is still reported once (ADR-0137 D4), not once per row.
- `visible: false` still hides the action, and a CEL string is still evaluated
  against the row, failing closed on a fault.
- A value that is not a predicate at all (`0`, `{}`) is no gate, as on every
  other action surface. It used to hide the action.

`isCustomRowActionVisible` is now exported from `@object-ui/components`, with an
optional fourth argument for the object's field definitions, so plugin-grid's
row menu reads this one function instead of keeping a twin.

Widening: `isCustomRowActionVisible(action, row, scope, fields?)` is a new public
export of `@object-ui/components`; before this release it was reachable only by a
deep module path that the package's `exports` map does not publish.
