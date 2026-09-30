---
'@object-ui/fields': patch
---

`TextField` renders the declared `maxLength` as the `maxlength` attribute of its input, or of its textarea when the field has `rows` above 1 (objectui#10179).

`FieldSchema` in `@objectstack/spec` declares `maxLength`, and `TextAreaField` already honoured it, but the single-line text widget never read it. Its DOM props pass through `toDomProps`, which forwards no `maxLength`, so no host could supply the limit either. Any host that renders the widget directly accepted input past the declared limit: the console's `/f/:slug` and `/forms/:name` form routes, `ActionParamDialog`, and `BulkActionDialog`. The record form was not affected, because it enforces the limit as a validation rule. A field that declares no `maxLength` renders no attribute, as before.
