---
'@object-ui/plugin-list': patch
---

A quick-filter value restored from the URL now gets its field's type once the object definition loads, when the field is declared without its type (objectui#12008).

Values restored from the URL arrive as strings. The dropdown bar converts them to the option's value type: `'true'` to `true` for a boolean field, `'2'` to `2` for a numeric option. It did this once, at mount. A field declared without its type, such as `fields: [{ field: 'is_active' }]`, takes its type and options from the object definition, and that definition loads after the list mounts. So the bar converted the value before it knew the type. A shared link such as `?uf_is_active=true` then filtered on the string `"true"`, and the chip counted 1 with no box ticked.

Now, the first time the definition changes a field's type or options, the bar converts that field's starting value once more: the restored value, or the author's default. The box is ticked and the query carries the typed value. A value the user has changed or cleared in the meantime is left as it is. A field declared with its type behaves as before. Nothing is emitted when the conversion changes nothing, so a select field with string options issues no extra query.

The fix also lists every read the bar makes of the object definition and tests each one against a definition that loads late. The label, the i18n scope and the lookup picker already followed a late definition; the starting value's type was the only read that did not. The `tabs` mode and the deprecated `toggle` mode read nothing from the definition.

No export, prop, type or language-pack key changes.
