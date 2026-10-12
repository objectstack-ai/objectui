---
'@object-ui/plugin-form': patch
---

The record form draws a field's `inlineHelpText` under its control (objectui#12213).

`@objectstack/spec`'s `FieldSchema` declares `inlineHelpText` ("Help text displayed below the field in forms"), and Studio's object field inspector writes it. `ObjectForm`'s field builder and `fromObjectSchema` both built a field's help line from `help`, then `description`, and never read `inlineHelpText`, so help text typed in Studio never appeared on the record form. Flow screens already drew it.

- FROM `field.help || field.description` → TO `field.inlineHelpText || field.help || field.description`

The two builders now share one read (`fieldHelpText`), so the flat, sectioned and tabbed forms cannot drift apart. The line is the control's accessible description, drawn under it, where flow screens draw it. An empty `inlineHelpText` reads as absent, so the field's description still shows. A `file` or `image` field's size hint follows the help text as before.

`help` is still read, behind `inlineHelpText`. The spec refuses it as an authoring key, but an objectstack server older than `@objectstack/spec` 17.7.0 serves a field's translated description there.
