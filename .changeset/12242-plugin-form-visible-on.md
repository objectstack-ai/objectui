---
'@object-ui/plugin-form': patch
---

The record form stops reading a field's snake_case `visible_on`. A field's visibility is `visibleWhen`, the key `@objectstack/spec`'s `FieldSchema` declares (objectui#12242).

`ObjectForm`'s object-field builder and the sectioned forms' name-string entries read `visible_on` beside `visibleWhen` and carried it onto the runtime field as a view-level gate. The spec refuses `visible_on` by name and suggests `visibleWhen`, and `BaseFieldMetadata` now refuses it, so the read retires with no alias.

- FROM `visibleWhen` plus the `visible_on` gate → TO `visibleWhen` alone, carried as before.

A predicate written under `visible_on` now gates nothing and is not reported. Write it as `visibleWhen`; a CEL predicate keeps the same text.
