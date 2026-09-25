---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio dataset-filter inspector no longer opens a stored condition as an
editable row it cannot keep, so editing ANOTHER row can no longer drop or rewrite it
(objectui#10257)

The inspector opened two kinds of stored condition in a dataset's or a measure's filter as
editable rows, and the builder could hold neither. It saves on every change, so an edit to
a DIFFERENT row changed them silently:

- **An incomplete value**, such as `{ $eq: '' }`, `{ $in: [] }`, `{ $ne: '' }`,
  `{ $nin: [] }`, a `null` comparand, or the implicit `{ field: '' }`, `{ field: null }`
  and `{ field: [] }`. The save path drops a row with no value as unfinished, so the stored
  condition disappeared. For `{ $in: [] }` that widened the dataset from no rows to every
  row.
- **An operator the column's filter menu does not offer**, such as `$in` on a date or
  number column, `$gt` / `$gte` / `$lt` / `$lte` on a text column, or `$exists` / `$null`
  on a boolean column. The operator control was drawn blank, and touching the row's field
  picker switched it to `equals`, which stored a different filter.

A filter like that now goes to the Source tab, as `$or` and nested groups already do. The
bridge checks every stored row two ways: the save path must keep it, and the column's
filter menu must offer its operator. A column listed without a type, or not listed at all,
is checked against the text operators, because the menu draws those for both. This is the
check objectui#10062 added for `$between`, now applied to every operator. A read with no
field list skips the menu check, as before.

A filter the builder can hold still opens in the builder and saves back unchanged, and the
save path itself is unchanged.

Two consequences to know about:

- The objectui#9382 entry says that a `$gt` / `$lt` the column's menu cannot settle (an
  unknown type, a column absent from the field list, or a menu offering neither reading)
  reads back through the fixed table. It still settles on that operator. But when a field
  list is given, no menu that leaves it unsettled offers `greaterThan` or `lessThan`, so
  that filter now goes to the Source tab instead of opening under a blank operator control.
- The field list is empty until the base object's fields have loaded, and it stays empty
  if they cannot be loaded. Until the fields load, a filter using an operator the text
  operators lack (for example `$in` on a select column, or `$gt` on a number column)
  shows the Source-tab note instead of the builder. `$between` has shown the note this way
  since objectui#10062.
