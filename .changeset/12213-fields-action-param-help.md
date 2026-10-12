---
'@object-ui/fields': patch
---

A field-backed action param's help line reads the field's `inlineHelpText`, in the order the record form reads it (objectui#12213).

When an action param backed by a field (`{ field: 'x' }`) declares no `helpText` of its own, `resolveActionParam` gives it the field's help text. It read `help`, then `description`, and never `@objectstack/spec`'s `FieldSchema.inlineHelpText`, the key Studio writes.

- FROM `param.helpText ?? field.help ?? field.description` → TO `param.helpText ?? (field.inlineHelpText || field.help || field.description)`

The param's own `helpText` still wins. An empty string on the field reads as absent, as it does on the record form, so the next key is used.
