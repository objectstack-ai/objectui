---
'@object-ui/app-shell': patch
---

Renaming a node in the flow designer now also updates the expressions that read its outputs, removing a node that is still referenced is refused, and the Problems panel reports a reference to a node that does not exist as an error (objectui#11838).

Later nodes read a node's outputs by its id. A decision branch reads `x.decision == 'approve'`, and a record field reads `{x.field}`. Renaming `x` used to update its edges and boundary event, but these expressions still named `x`. The saved draft then read a node that no longer existed, and the Problems panel showed only a scope warning.

- **The rename updates every expression that reads the node, in the same change.** This covers decision branches, edge conditions, value expressions, and `{x.field}` or `{{x.field}}` holes in text, including those inside a loop, parallel or try/catch region. Each expression is read with the expression parser. Only the node's name changes. A different identifier that contains the old id (`xy`), a field named like it (`y.x`), text inside quotes, and a variable the expression itself declares with the same name (`rows.exists(x, x.ok)`) are not changed.
- **A rename that cannot update an expression safely is refused, and nothing changes.** If an expression that reads the node does not parse, the message under the ID field names it. The rename is also refused when the old or new id is also a variable name in the flow, because the expression could mean either one.
- **Removing a node that is still referenced is refused, and nothing changes.** While a boundary event is attached to the node, or an expression reads its outputs, both **Remove node** in the inspector and the **Delete** key on the canvas refuse the removal. The message names each place that still refers to the node: under the button, or at the top of the canvas. Change or remove those first, and the removal then goes through. The node's own edges are still removed with it, as before.
- **The Problems panel reports two new errors.** An expression that reads a node that does not exist is an error, for example `x.decision` in a flow saved without node `x`. So is a boundary event attached to a node that does not exist. Each error is shown on the node or edge where the expression is written. The debugger's Run check is unchanged, because the platform accepts these flows and fails only when it reaches that node.

No export, prop, type member or language-pack key is added. The new messages are in the metadata-admin designer's own string tables (en and zh).
