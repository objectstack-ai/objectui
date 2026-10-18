---
'@object-ui/app-shell': minor
---

The metadata-admin widget registry's labelling vocabulary (`WidgetLabelling`) and the dashboard widget inspector's `labelling` prop are typed against `@object-ui/core`'s `RegistryComponentMeta['labelling']` instead of `ComponentMeta['labelling']` (objectui#6349, batch 4). `@object-ui/core`'s `ComponentMeta` is now the general component metadata and no longer carries `labelling`; the registration type that does is `RegistryComponentMeta`.

**Breaking-change note.** Nothing breaks for a consumer of this package: both types still resolve to the same `'control' | 'group'` vocabulary, and no runtime behaviour changes. The breaking half of this rename is `@object-ui/core`'s, recorded in its changeset.
