---
'@object-ui/fields': patch
---

fix(fields): "Is empty" / "Is not empty" no longer send an empty-string comparand to a numeric, boolean or temporal column

`FilterConditionField` (the `filter-condition` widget behind `relatedListFilter`,
a roll-up's `summaryOperations.filter` and `sys_sharing_rule.criteria_json`)
wrote "Is empty" as `{ $or: [{ FIELD: { $in: [''] } }, { FIELD: { $null: true } }] }`
and "Is not empty" as `{ FIELD: { $nin: [''], $null: false } }` on every field
type, number and date included. On a numeric, boolean or temporal column the
SQL driver binds that `''` as-is, so it reached the column as `IN ('')` /
`NOT IN ('')` — a comparand a strict backend has to cast.

A field whose type is one of `@objectstack/spec`'s numeric, boolean, calendar-day,
instant or time-of-day value classes (`number`, `currency`, `percent`, `rating`,
`slider`, `progress`, `summary`, `boolean`, `toggle`, `date`, `datetime`, `time`)
now gets the null half alone:

- "Is empty": `{ FIELD: { $null: true } }`
- "Is not empty": `{ FIELD: { $null: false } }`

Every other column — text, select, lookup and the rest of the string-stored
types, and a field whose type the widget does not know — keeps the shapes above
byte for byte, because there `''` is a value a record can hold. A criteria saved
in an older shape on a typed column still opens as the same "Is empty" /
"Is not empty" row and is rewritten only when an admin edits it; the new shape
reopens under the "Is null" / "Is not null" label it shares with those operators.
