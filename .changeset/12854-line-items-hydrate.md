---
'@object-ui/plugin-form': patch
---

`record:line_items` fills an untyped column from the child object's field (objectui#12854, the objectui half of objectstack-ai/objectstack#24140).

A column listed only by `name` was headed by the bare field name and edited as plain text, on screen and on a print page. The panel now passes its columns through `hydrateColumns`, the function the master-detail form already uses: a column without a `type` takes its `label`, `type` and `options` (and the field's `required`, lookup reference and formula) from the child object's field. The child schema is the one the panel already loads, which the object-metadata endpoint serves in the session locale, so a heading translates the same way a master-detail grid's does.

An authored `label` or `type` still wins, and a column whose field the child object does not declare renders as before. Nothing is added to the package entry: no export, prop, type member or language-pack key.
