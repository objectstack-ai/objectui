---
'@object-ui/fields': patch
---

fix(fields): the lookup dropdown and record picker stop showing fields field-level security denies, and PeoplePicker's `$expand` is gated

A lookup field's dropdown and its browse-all picker (`RecordPickerDialog`)
filtered their `$expand` through field-level security, but not what they
draw. Once the permission policy had loaded, a column the user may not read
on the referenced object was still previewed under each dropdown candidate,
and still headed and rendered in every picker row. A denied relation column,
left out of `$expand`, arrived as a bare id, and the lookup cell renderer then
fetched each related record on its own. A denied display field still labelled
every option, and a `titleFormat` template still printed every field it
named.

Both now treat those fields the way `RelatedList` treats its columns: once the
policy has loaded, a column the user may not read on the referenced object is
not previewed in the dropdown, and is neither headed nor rendered in the
picker. The picker's display column is gated like any other column. Its id
column never is, and when the policy leaves no other column to draw, the
picker draws the id column so that every row can still be told apart and
chosen. A `renderGrid` slot on the picker receives the same columns. Before
the policy loads, nothing is filtered, and the columns are re-derived when it
arrives.

An option's label is built from the row with the denied fields removed,
the same row ObjectStack's `FieldMasker` already serves, so on that backend
labels do not change. A denied display field therefore falls through to the
next source of a label, ending at the record id, and a `titleFormat` template,
in the dropdown's labels and in the picker's display column, leaves a denied
field's slot empty. The label is a display value only: the committed value is
unchanged, the records the picker hands to `onSelectRecords` are unchanged,
and the option the dropdown hands to `onSelectRecord` still carries the served
row's other fields beside its label.

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
