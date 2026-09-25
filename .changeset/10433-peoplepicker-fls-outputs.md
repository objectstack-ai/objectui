---
'@object-ui/fields': patch
---

fix(fields): PeoplePicker rows and its selection tray, and a people lookup's chip, stop drawing fields field-level security denies

A lookup field that sets `picker: 'search'` (every user field does by default)
opens `PeoplePicker`, whose rows show an avatar and a subtitle line built from
the field's `subtitle` paths, such as `primary_business_unit_id.name` and
`email`. Only the `$expand` those paths imply was filtered through field-level
security. Once the permission policy had loaded, a row still drew every
subtitle field and the avatar straight from the record the server returned, so
a field the user may not read on the queried object, such as `email`, still
showed. The multi-select tray drew the same avatar, and the field's selected
chips drew theirs from the configured avatar field, then from `image`.

Now, once the policy has loaded, a row leaves out each subtitle path whose
field on the queried object the user may not read, and draws no avatar image
when the avatar field is denied: the initials show instead, and the row can
still be chosen. A path through a relation is judged by the relation field, so
it is left out even when a backend returns the related record without being
asked. The tray follows the same rule. A chip judges both keys it reads: the
configured avatar field, and `image`, which it falls back to. A readable
`image` still stands in for a denied avatar field. Before the policy loads,
nothing is withheld. The records the picker hands to `onSelectRecords` are
unchanged.

This is defence in depth: ObjectStack's `FieldMasker` already removes the
fields a user may not read from the rows it returns. The change matters for a
backend that does not.
