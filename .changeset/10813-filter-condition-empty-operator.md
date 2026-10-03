---
'@object-ui/fields': minor
---

`FilterConditionField` writes "Is empty" / "Is not empty" as the spec's one 「is empty」 operator, `{ FIELD: { $empty: true } }` / `{ FIELD: { $empty: false } }` (objectui#10813).

The widget behind sharing-rule `criteria_json`, `relatedListFilter` and `summaryOperations.filter` used to write its own meaning of 「is empty」: `{ $or: [{ FIELD: { $in: [''] } }, { FIELD: { $null: true } }] }` and its complement `{ FIELD: { $nin: [''], $null: false } }`, i.e. "no value OR `''`" on every field type. The `''` member reached a number or date column as `IN ('')`, and a multi-value column (stored as JSON by the SQL driver) as an `$in` that driver refuses. `@objectstack/spec` 17.6.0 admits `$empty` to `FILTER_OPERATORS` (objectstack#20446), and its meaning is the field's DECLARED row of the spec's per-type table (ruling B on objectstack#20311): null or `''` on a text-like field, null or `[]` on a multi-value field, null alone on every other type. Every evaluator expands it itself (`expandEmptyOperator`), so the widget now writes the same token on every column type and keeps no copy of the table.

The `@objectstack/spec` dependency floor rises from `^17.5.0` to `^17.6.0`, because this package now writes `$empty`, which `@objectstack/spec` 17.5.0 declares staged and refuses.

`kvToCondition` reads `$empty` back as the pair, with a boolean flag only: any other flag stays the raw criteria it is, as every evaluator refuses it.

**What moves for a stored rule.** Reading alone rewrites nothing: a criteria saved in either earlier shape (the objectui#10790 `$or` entry and `$nin` + `$null` pair, or the older `$in: [null, '']` / `$nin: [null, '']`) still opens as the same "Is empty" / "Is not empty" row, and an un-edited rule keeps its stored bytes and keeps matching as before. The next time the criteria is edited, those rows are written as `$empty`, which re-scopes the rule:

- text-like column: no change (both mean null or `''`);
- every other single-valued column (number, boolean, date, datetime, time, select, a single lookup): a row holding `''` is no longer "empty" and becomes "not empty". Since objectstack#20308 the write door stores a cleared number, boolean, date, datetime or time as null, so on those types only a value written before it can hold `''`; a select or lookup can still hold one, and the spec's ruled table does not count it as empty;
- multi-value column (multiselect, checkboxes, tags, or a `multiple: true` select, lookup or user): a row holding `[]` becomes "empty" and leaves "is not empty". On the SQL driver the earlier shape was refused outright, so a rule there starts running;
- the `$in: [null, '']` shapes were refused by every objectstack filter face, so a rule still in them starts running.

Measured on the installed 17.6.0 by-value readers (`@objectstack/formula`'s `matchesFilterCondition` and `ValueDataSource`) over null, an absent key, `''`, `[]` and set values: the `$or` entry and `$empty: true` disagree only on `[]`. Readable stores (this repository, objectstack, hotcrm and cloud) hold no criteria in either earlier shape.
