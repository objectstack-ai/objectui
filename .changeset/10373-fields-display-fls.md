---
'@object-ui/fields': patch
---

fix(fields): the lookup dropdown and record picker stop drawing columns field-level security denies, and PeoplePicker's `$expand` is gated

A lookup field's dropdown and its browse-all picker (`RecordPickerDialog`)
filtered their `$expand` through field-level security, but not the columns
they draw. Once the permission policy had loaded, a column the user may not
read on the referenced object was still previewed under each dropdown
candidate, and still headed and rendered in every picker row. A denied
relation column, left out of `$expand`, arrived as a bare id, and the lookup
cell renderer then fetched each related record on its own.

Both now drop those columns from what they draw, the way `RelatedList` treats
its columns: once the policy has loaded, a column the user may not read on the
referenced object is not previewed in the dropdown, and is neither headed nor
rendered in the picker. A `renderGrid` slot on the picker receives the same
filtered columns. The picker never filters its display column or its id
column, and choosing a row still commits its id; the dropdown's option label
is not a preview column and is not filtered either. Before the policy
loads, nothing is filtered, and the columns are re-derived when it arrives.

`PeoplePicker`, which a lookup opens when its field sets `picker: 'search'`,
derives its `$expand` from dotted `subtitle` paths such as
`primary_business_unit_id.name` when no `expand` is passed, and that list had
no permission check. Once the policy has loaded, a relation the user may not
read on the object the picker queries is now left out of `$expand`, whether
the list was derived from the subtitle paths or passed as `expand`. A subtitle
segment that goes through a relation left out shows nothing, as it does when a
backend ignores `$expand`.

This is defence in depth: ObjectStack's `FieldMasker` already removes the
fields a user may not read from the rows it returns. The change matters for a
backend that does not.
