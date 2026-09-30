---
---

Tests and one source comment only, no package released (objectui#7347). A grouping field name with
leading or trailing whitespace is now refused by the producer, `@objectstack/spec`'s
`GroupingFieldSchema.field` (objectstack-ai/objectstack#17360, in the spec version this repository
already resolves). This change adds the regression pin for objectui's side: every validation face that
declares `grouping` (`list-view`, `object-gallery`, and `object-view`'s named list views, each on the
tolerant face, through `safeValidateSchema`, on the strict face and on the exported mirror itself)
refuses a padded name with one `custom` issue at that entry's `field`, and parses the unpadded
control. Which arms declare `grouping` is derived from the union by a census in the same file, so an
arm that starts declaring it is covered or the census goes red. The stale sentence in
`collectGroupingFieldRefs`'s docblock that called the field a bare string is corrected; the
harvester's trim stays, as ruled.
