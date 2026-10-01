---
'@object-ui/types': minor
---

objectui's app document refuses `mobileNavMode` by name, the answer the platform already gives
(objectui#11363).

**Breaking for an app document that carries `mobileNavMode`.** `AppSchemaRenderer`
(`@object-ui/layout`) reads the mobile navigation mode only from its `mobileNavMode` prop, or from
the `mobileNavMode` key of an `app-schema-renderer` node, which `SchemaRenderer` passes to it as
that prop. It never reads the key from the app document, and `@objectstack/spec`'s strict
`AppSchema` refuses it there (`unrecognized_keys`). objectui's `AppComponentSchema` did not declare
the key, but `BaseSchema`'s `.passthrough()` kept it: a document carrying `mobileNavMode`, a
misspelt value included, parsed clean, and the shell drew no bottom bar.

- `@object-ui/types`: `AppComponentSchema.mobileNavMode` is now `never` on the TypeScript face,
  and the zod mirror refuses the key by name, at its own path (`invalid_type`). The message opens
  with the spec's own answer, "Unrecognized key(s) on this app: `mobileNavMode`.", and names the
  two places the mode is read. `safeValidateSchema` (what `objectui validate` runs) gives the same
  refusal. So does the strict authoring face, which refused the key before only as an unnamed
  `unrecognized_keys`.
- Unchanged: the `mobileNavMode` prop of `AppSchemaRenderer`, and the `mobileNavMode` key of an
  `app-schema-renderer` node, which `sdui-parser` still checks against `'drawer'` |
  `'bottom_nav'`. That node is not judged by `AppComponentSchema`, so the key stays valid there.

Migration: remove `mobileNavMode` from the app document and set it where it is read, either as
the prop (`mobileNavMode="bottom_nav"` on `AppSchemaRenderer`) or as the node key
(`{ "type": "app-schema-renderer", "mobileNavMode": "bottom_nav" }`). An app saved through the
platform is judged by the spec's `AppSchema`, which already refuses the key.
