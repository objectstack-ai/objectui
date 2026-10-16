---
'@object-ui/plugin-form': minor
---

The record form draws a field's `inlineHelpText` under its control, and no longer reads a field's `help` (objectui#12213).

`@objectstack/spec`'s `FieldSchema` declares `inlineHelpText` ("Help text displayed below the field in forms"), and Studio's object field inspector writes it. `ObjectForm`'s field builder and `fromObjectSchema` both built a field's help line from `help`, then `description`, and never read `inlineHelpText`, so help text typed in Studio never appeared on the record form. Flow screens already drew it.

- FROM `field.help || field.description` → TO `field.inlineHelpText || field.description`

The two builders now share one read (`fieldHelpText`, exported by `@object-ui/fields`), so the flat, sectioned and tabbed forms cannot drift apart. The line is the control's accessible description, drawn under it, where flow screens draw it. An empty `inlineHelpText` reads as absent, so the field's description still shows. A `file` or `image` field's size hint follows the help text as before.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

Translated field help on the record form needs an objectstack server on `@objectstack/spec` 17.7.0 or later (objectstack-ai/objectstack `bab76850c`, objectstack-ai/objectstack#21956). `FieldSchema` refuses `help` as an authoring key, and its one producer was a server on spec 17.6.0 or earlier, whose translator put a field's translated description on the served field's `help` key. 17.7.0 serves that text on `description`, which the form reads. Against an older server, a field's help line shows its `description` as the server stores it, untranslated, and a field whose only help is a served `help` key shows no help line. Fix: run the server on spec 17.7.0 or later, within the same major. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)
