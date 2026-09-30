---
'@object-ui/fields': patch
---

fix(fields): PeoplePicker rows, its selection tray and the read-only user cell stop drawing a person's name or avatar that field-level security denies

`PeoplePicker` (the search-first picker every user field opens by default)
read each person's name straight from the record the server returned: the
field's display field, then `name`, `username` and `label`. Once the
permission policy had loaded, a name the user may not read on the queried
object still showed in the candidate row, in the multi-select tray chip, in
the avatar's alt text and in the chip's remove label. The read-only `user`
cell drew the name (`name`, then `username`) and the avatar (`image`) of an
expanded person the same way, in both its single and its multi-value form.

Now, once the policy has loaded, a name field the user may not read is
skipped and the next readable one shows instead, the same fallback the lookup
field's option label already uses. When none is readable, the row and the
tray show their usual placeholder, and the cell shows `User`. The cell draws
no avatar image when `image` is denied: the initials show instead. The cell
judges the fields on the object the field's `reference_to` (or `reference`)
names, and on `sys_user` when it names none. A policy that loads or changes
later relabels what is already on screen. Before the policy loads, nothing is
withheld. The records the picker hands to `onSelect` and `onSelectRecords`
are unchanged.

This is defence in depth: ObjectStack's `FieldMasker` already removes the
fields a user may not read from the rows it returns, and on those rows nothing
changes. The change matters for a backend that does not.
