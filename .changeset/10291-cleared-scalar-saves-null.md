---
'@object-ui/fields': minor
'@object-ui/components': minor
---

fix(fields,components): a single select or radio emptied by a cascade clear is now saved — as `null`

When a controlling field changes and a single select or radio no longer offers
its current value, the cascade clear empties it. It emptied it to `undefined`,
and the JSON transport omits an own `undefined` key (`@objectstack/client`'s
`data.update` sends `body: JSON.stringify(data)`). So the user saw the field
emptied, pressed Save, and the stored value survived and came back on refresh —
on the record page's inline edit (reachable since objectui#7190) and in forms
alike. The multi-value clear beside it wrote a real `[]` and was saved; the two
disagreed.

Both clears that can empty a scalar now write `null`, the write contract's
"clear the stored value" (an absent key means "leave it unchanged"):

- `SelectField` and `RadioField` (`@object-ui/fields`) emit `onChange(null)`.
  This covers every host that renders them: inline edit, `ObjectForm` and the
  other form variants.
- The form renderer's own cascade clear (`@object-ui/components`) sets `null`.
  It runs independently of the widgets and is the only clear for a field no
  option widget renders: a field `visibleWhen` keeps unmounted, or the built-in
  `select` branch. The clear-on-hide effect in the same file already wrote
  `null` for the same reason.

`SelectField` also renders a `null` value as "nothing chosen": it shows the
placeholder, as an empty string does. Before this change a raw `null` painted a
blank trigger.

A multi-value clear still writes its array. A select nobody touched is still not
staged: no invented `null` reaches a save, so a server default is not
suppressed. Required validation, the master-detail dirty diff and the create
form's default omission already treat `null` and `undefined` as the same blank,
so none of them changes.
