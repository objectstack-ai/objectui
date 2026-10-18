---
'@object-ui/plugin-grid': patch
'@object-ui/plugin-dashboard': patch
---

A grid grouped by a select field, and a dashboard chart over a select dimension, now list the field's values in the order the field declares its options, not in alphabetical order (objectui#11809).

Grouped by a task's Status, a grid read Backlog, Done, In Progress, In Review, To Do. A dataset chart drew its bars in the same order, and a donut over Priority listed its legend as High, Low, Medium, Urgent. The field declares Backlog → To Do → In Progress → In Review → Done and Low → Medium → High → Urgent, and the Kanban board over the same field already draws its lanes in that order.

- **Grid grouping.** When the grouping field has options, the groups follow the declared order, and `order: 'desc'` reverses it. A stored value that no option declares comes after the declared ones, sorted by label, and the empty group comes last, in both directions. A grouping field with no options keeps label order, as before. This holds whether the grid groups the rows itself or the server answers the groups.
- **Dataset charts.** A dashboard dataset widget charts the first dimension's values in its declared order on the category axis, and on a pie or donut in the slices and the legend. A value no option declares comes after the declared ones, in the order the dataset returned it, and the empty bucket comes last. When a chart splits one measure by a second select dimension, its series and legend follow that dimension's declared order. An explicit `options.sortBy` on the widget is the author's order and is left as the dataset returned it. Clicking a bar still opens that bar's records. Tables and pivot tables keep the dataset's row order.

Nothing is added to either package's entry: no export, prop, type member or language-pack key. The published `useGroupedData` hook keeps its signature, and with no option order to read it keeps label order.
