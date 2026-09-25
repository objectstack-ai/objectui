---
'@object-ui/fields': minor
---

fix(fields)!: the record picker's display column labels a record the way the lookup dropdown does, and `RecordPickerDialog`'s `titleFormat` prop is replaced by `objectSchema`

⚠️ Breaking change (marked `minor` under this repo's version policy): the
published `RecordPickerDialog` component's `titleFormat` prop is removed. Pass
`objectSchema`, the referenced object's schema, instead. Tracked as
objectui#10486, the picker half of the lookup branch of ruling C1 on
objectui#9436 (the field's own `displayField`, then the object's `nameField`,
then the deprecated `titleFormat`).

- **Before.** The browse-all picker's display column rendered a bare
  `titleFormat` string through its own single-brace renderer, above the
  referenced object's `nameField` and above the lookup's declared
  `displayField`. A double-brace template kept its outer braces. With no
  template the column never read `nameField`: it showed the record's `name`
  value, or nothing when the object has no `name` field. The dropdown option
  for the same record showed the `nameField` value.
- **After.** When `objectSchema` is given, the display column renders
  `@object-ui/core`'s `getRecordDisplayName(objectSchema, row, { titleField })`,
  the call the dropdown's option label and the lookup cell renderer make: the
  declared `displayField`, then `nameField` (and its deprecated aliases), then
  `titleFormat`, then type-aware derivation. The row is the one the dropdown
  labels from: relations collapsed to ids and fields the loaded policy denies
  removed. The resolver's `Untitled` / `Record #id` floor is not used as a
  title; such a record keeps its column's own value.
- **`displayField` is the declared value.** Pass the lookup's declared display
  field, or leave it out when the field declares none. The display column is
  still keyed on `'name'` when it is omitted, but only a declared value ranks
  above the object's declarations.
- **The column moves for `nameField`-only objects too.** It now shows the
  `nameField` value where it used to show the `name` value or a blank cell.
- Without `objectSchema` the display column renders its own value, as before.
  `LookupField` passes the schema and the declared display field; no other
  caller in this repository passed `titleFormat`.

This change also corrects two pending changesets that described the picker
before it: the objectui#10343 one now says the picker's display column follows
the dropdown's resolver, and the objectui#6874 one names the current
`objectSchema={refObjectSchema}` pass, whose conclusion stands.
