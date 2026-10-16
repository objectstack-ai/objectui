---
'@object-ui/types': minor
---

`AutoNumberFieldMetadata` declares `autonumberFormat`, typed by reference to `@objectstack/spec`'s `FieldSchema.autonumberFormat`, and keeps `format` as its shorthand (objectui#12282).

- FROM `format?: string` alone → TO `autonumberFormat`, typed as `@objectstack/spec/data`'s `Field['autonumberFormat']` (a string), beside `format?: string`. The spec prefers `autonumberFormat` on a new field, and its own field form, which Studio's field designer renders, offers it for an `autonumber` field. A typed literal carrying it used to fail with an excess-property error.

`format` is not retired: the spec still accepts it as the shorthand that predates `autonumberFormat`. When a field sets both, the backend uses `autonumberFormat` (`resolveAutonumberFormat`, `@objectstack/spec/data`). The `auto-number` field docs page teaches `autonumberFormat` for a new field and `format` as the shorthand. `autonumber-format-declared-12282.test.ts` pins both keys beside the installed spec's own answer.

**Clause-②: yes**: the authoring face gains `autonumberFormat` on `AutoNumberFieldMetadata`. Nothing is removed, so every literal that compiled before still compiles.
