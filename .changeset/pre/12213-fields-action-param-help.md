---
'@object-ui/fields': minor
---

A field-backed action param's help line reads the field's `inlineHelpText`, through the one read the record form uses, and no longer reads a field's `help` (objectui#12213).

When an action param backed by a field (`{ field: 'x' }`) declares no `helpText` of its own, `resolveActionParam` gives it the field's help text. It read `help`, then `description`, and never `@objectstack/spec`'s `FieldSchema.inlineHelpText`, the key Studio writes.

- FROM `param.helpText ?? field.help ?? field.description` → TO `param.helpText ?? fieldHelpText(field)`, which reads `field.inlineHelpText || field.description`

The param's own `helpText` still wins. An empty string on the field reads as absent, as it does on the record form, so the next key is used.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

Translated field help on a field-backed param needs an objectstack server on `@objectstack/spec` 17.7.0 or later (objectstack-ai/objectstack `bab76850c`, objectstack-ai/objectstack#21956). `FieldSchema` refuses `help` as an authoring key, and its one producer was a server on spec 17.6.0 or earlier, whose translator put a field's translated description on the served field's `help` key. 17.7.0 serves that text on `description`, which is read. Against an older server, the param's help line shows the field's `description` as the server stores it, untranslated, and a field whose only help is a served `help` key lends none. Fix: run the server on spec 17.7.0 or later, within the same major. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)
