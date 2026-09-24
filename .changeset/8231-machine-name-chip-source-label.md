---
'@object-ui/app-shell': patch
---

fix(app-shell): the metadata form's machine-name chip is judged on the field's untranslated source label, so it shows alike in every locale (objectui#8231)

`SchemaForm` shows a small `code` chip with a field's machine name when the label does not
already spell that name. It used to compare `prettify(name)` with the VISIBLE label, which in
a localized panel is a translation: `prettify('columns')` can never equal 「列数」. So the
Chinese Studio dashboard panel showed a chip beside every field, while the English panel hid
it beside the same fields.

The chip now judges the untranslated source label: the label the spec form authored before
the locale overlay (`localizeMetadataForm`) replaced it, then the schema's own title, then the
humanized name. That is the label the row would show in English, so the chip now appears or
hides the same way in every locale. The overlay keeps that source label on each field under a
module-private symbol key. This is not a `FormFieldSpec` key, it is never serialized, and it
is not part of any exported type. `mergeServerFields` now copies the bundled form shallowly
instead of round-tripping it through JSON, so the source label also survives grafting
server-only fields on.

What an author sees change: in a Chinese panel, the chip no longer sits beside every
translated field. It shows only where the source label really does not spell the machine
name, which is the same set of fields as in English.
