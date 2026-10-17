---
'@object-ui/types': minor
---

`DetailViewField.dueLike` and its `DetailViewFieldSchema` row are removed, with no alias (objectui#11815). A deadline is declared on the object's field metadata — `DateFieldMetadata.dueLike` / `DateTimeFieldMetadata.dueLike` and their partner `settledWhen`, by reference to `@objectstack/spec` — and the detail view reads it from there. A detail-view entry that still writes `dueLike` is a compile error; the zod mirror now drops the key as it drops any unknown one. Fix: delete the key from the view entry and declare `dueLike: true` on the object field.
