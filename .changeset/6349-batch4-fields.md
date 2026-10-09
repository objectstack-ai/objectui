---
'@object-ui/fields': minor
---

`FIELD_WIDGET_LABELLING` is typed against `@object-ui/core`'s `RegistryComponentMeta['labelling']` instead of `ComponentMeta['labelling']` (objectui#6349, batch 4). `@object-ui/core`'s `ComponentMeta` is now the general component metadata and no longer carries `labelling`; the registration type that does is `RegistryComponentMeta`.

**Breaking-change note.** Nothing breaks for a consumer of this package: the export's value type still resolves to the same `'control' | 'group' | 'display'` vocabulary, and no runtime behaviour changes. The breaking half of this rename is `@object-ui/core`'s, recorded in its changeset.
