---
'@object-ui/plugin-tree': patch
---

fix(plugin-tree): tree cells draw the same field faces as list cells, so a boolean no longer shows as `true` (objectui#11686)

A tree view, such as the Org Chart tab on Setup → Business Units, printed most column values as raw text. Its cells knew only option labels and referenced records; every other type was printed as stored, so the boolean "Active" column read `true`, and dates, numbers and currency amounts showed their stored form while the list tabs on the same page drew them properly.

Each tree cell whose column the object defines now draws through the field package's cell display for that field type, the same one the grid, kanban and gallery cards use. A boolean draws the read-only checkbox, a date the locale-aware date, a currency the formatted amount, a select its option badge and a lookup the referenced record's name. Where a display names its own column, as the boolean display's badge for an inactive `active` field does, it uses the column label the tree's header shows, so it reads in the session's language. A column the object does not define keeps the plain text it showed before.

`@object-ui/plugin-tree` now declares `@object-ui/fields` as a dependency; it already reached it through `@object-ui/plugin-detail`. Nothing is added to the package entry: no export, prop, type member or language-pack key.
