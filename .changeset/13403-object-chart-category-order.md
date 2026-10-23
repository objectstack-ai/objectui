---
'@object-ui/plugin-charts': patch
---

A page-level `object-chart` bound to a `dataset` now draws a select dimension in the order its field declares its options, the order the dashboard's dataset widget already uses for the same dataset (objectui#11809). Before, the page block drew the dataset's GROUP BY order (the stored values, alphabetically), so a priority axis read High, Low, Medium, Urgent instead of Low, Medium, High, Urgent (objectui#13403). The rows are charted in declared order, values the options do not declare follow, and the empty bucket comes last; the schema handed to the renderer also carries the `categoryOrder` from `@object-ui/core`'s `buildCategoryOrder`, which a funnel orders its stages by. A dimension whose field declares no options keeps the dataset's order.
