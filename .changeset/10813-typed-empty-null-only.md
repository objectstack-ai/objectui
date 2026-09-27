---
'@object-ui/fields': patch
---

fix(fields): "Is empty" / "Is not empty" no longer send an empty-string comparand to a numeric or boolean column

`FilterConditionField` (the `filter-condition` widget behind `relatedListFilter`,
a roll-up's `summaryOperations.filter` and `sys_sharing_rule.criteria_json`)
wrote "Is empty" as `{ $or: [{ FIELD: { $in: [''] } }, { FIELD: { $null: true } }] }`
and "Is not empty" as `{ FIELD: { $nin: [''], $null: false } }` on every field
type, number included. On a numeric or boolean column the SQL driver binds that
`''` as-is, so it reached the column as `IN ('')` / `NOT IN ('')` — a comparand a
strict backend has to cast.

A field whose type is in `@objectstack/spec`'s numeric or boolean value class
(`number`, `currency`, `percent`, `rating`, `slider`, `progress`, `summary`,
`boolean`, `toggle`) now gets the null half alone:

- "Is empty": `{ FIELD: { $null: true } }`
- "Is not empty": `{ FIELD: { $null: false } }`

Every other column keeps the shapes above byte for byte: text, select, lookup and
the rest of the string-stored types, and a field whose type the widget does not
know, because there `''` is a value a record can hold. `date`, `datetime` and
`time` keep them too: an edit form sends a cleared date, date-time or time box as
`''`, and on a backend that stores those columns as text the value is kept, so
dropping the member would change which records a rule matches there.

A criteria saved in an older shape on a numeric or boolean column still opens as
the same "Is empty" / "Is not empty" row and is rewritten only when an admin
edits it; the new shape reopens under the "Is null" / "Is not null" label it
shares with those operators.
