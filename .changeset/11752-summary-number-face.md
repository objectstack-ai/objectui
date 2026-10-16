---
'@object-ui/fields': patch
'@object-ui/types': patch
---

A summary (roll-up) field reads the same in a read-only form and in a table cell (objectui#11752).

The read-only form face (`SummaryField`) formatted the value by the roll-up's aggregation function: a `count` as it arrived, a `sum` / `avg` / `min` / `max` at two fixed decimals. The table cell, which `summary` shares with `formula`, draws a number as the number cell does. So one stored value read two ways: a `sum` over `15750.5` read `15750.50` in the form and `15,750.5` in the cell, and a `count` of `12000` read `12000` and `12,000`.

The form face now reads the value the way the cell does, whatever the function:

- **number**: formatted as a number field formats it, in the viewer's display locale. With no `scale` on the field the value keeps its own precision, so `15750.5` reads `15,750.5` and a `count` of `12000` reads `12,000` in en-US and zh-CN, in both faces. A count stays whole. A `scale` on the field fixes the width in both faces (`scale: 2` reads `15,750.50`). Two fixed decimals are no longer added, so an average reads at its own precision unless the field declares a `scale`.
- **empty**: an empty string or empty list draws the empty-value mark, as in the cell, where the form drew a blank. A stored `0` (a `count` or `sum` over no child rows) reads `0`, where the form read `0.00`.
- **anything else**: the value as text, as the cell prints it.

No export, prop or language-pack key is added. The `summaryOperations` doc comments in `@object-ui/types`, on `SummaryFieldMetadata` and on the form field, now describe this rule in place of the retired per-function face.
