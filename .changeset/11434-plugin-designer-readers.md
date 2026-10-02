---
'@object-ui/plugin-designer': minor
---

The data-model and process designers draw the members their node declarations always carried and they never read (objectui#11434).

**Data-model designer.**

- Each field row draws its `label` beside the name, a `UQ` badge when `unique`, and its `defaultValue` after the type (as JSON, so a string is quoted and `null` shows), with the field's `description` and default as the row's tooltip.
- Each relationship line runs from the row of its `sourceField` to the row of its `targetField`, edge to edge, instead of centre to centre whatever the fields said. Cards whose columns overlap are joined on their right edges by a curve. A field name the entity does not declare anchors at the entity header, and the line's tooltip says which name was not found.
- A relationship's `deleteBehavior` is drawn beside its label and in the line's tooltip. Renaming a field on the canvas renames it in every relationship that names it, so its line stays on the row.
- The card's header and rows have fixed heights now, so the lines can be anchored at them.

**Process designer.**

- The toolbar draws the process `version` beside its name.
- Each lane in `lanes` is drawn as a band around the nodes its `nodeIds` names, labelled with its `label` and `role`, under the flows and the nodes.
- A flow draws its `condition` in brackets, and BPMN's slash marker at its source when it `isDefault`.
- The property panel of a selected node offers its `assignee` and `dueDate` on a user task, its `script` on a script task, either on any node that already carries a value, and each entry of its `properties` under its key, with a control for the value's type.

Nothing in the components' props changed: `ProcessDesignerProps` already declared `version` and `lanes`, and the rest are members of the records the props already took.
