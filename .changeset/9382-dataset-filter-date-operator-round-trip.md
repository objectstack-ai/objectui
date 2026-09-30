---
'@object-ui/app-shell': patch
---

Read a stored `$gt` / `$lt` back as the operator the column's dropdown actually
offers, in the dataset/measure filter inspector (objectui#9382).

A dataset filter built with **After** on a date column was stored as
`{field: {$gt: value}}` — correct, and it filtered correctly — but reopened as
`greaterThan`, which the date bucket does not list. Radix draws nothing for a
value no mounted item carries, so the operator control came back **blank**: the
author could not read what their own filter did.

Measured over every (field type, operator) pair the dropdown can build: 6 broke
— `before` and `after` on each of `date`, `datetime` and `time` — and the other
116 round-tripped exactly. Driven in the real component, the reopened trigger
rendered the empty string, against a control of `Greater than` for the same
token on a number column. The damage did not stop at the blank: touching that
row's field picker sent the unlisted operator through the builder's own
reconcile step, which settled it on `equals` and committed it, turning a
"greater than" filter into an "equals" filter with no error.

The write half is unchanged and the stored bytes are unchanged. There is one
spec token for "strictly greater" and no `$after`, so the collapse is not a
defect in what gets stored — only the LABEL was lost, and the label is a
function of the field's declared type because that is what decides which bucket
the dropdown draws. `conditionToGroup` now takes the same `fields` list the
inspector already hands the builder, and settles an ambiguous token against
that field's own bucket. Nothing new is accepted: when the type is unknown, the
field is absent from the list, or the bucket offers neither candidate, the read
falls back to the unchanged fixed table. Since objectui#10257, a row whose
column menu does not offer that fallback operator is sent to the Source tab
instead of being opened. With a field list, which the inspector always passes,
that covers all three cases. An untyped or unlisted column gets the text menu,
which offers neither `greaterThan` nor `lessThan`, and a menu that offers
neither candidate cannot offer the fallback, which is one of them. Only a read
with no field list still opens the row under the fixed-table operator.

`@object-ui/components` is untouched — the operator buckets are read, never
changed.
