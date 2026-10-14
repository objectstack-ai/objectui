---
'@object-ui/components': minor
'@object-ui/console': patch
'@object-ui/types': patch
---

`element:repeater` reads its query from the node-level `dataSource` binding alone (objectui#12345). `@objectstack/spec` 18 retired the row's flat `object`, `filter`, `sort` and `limit` (objectstack#11509, ruled A-narrow), and `@object-ui/types` already refuses them by name. There is no grace window and no second spelling.

- **Renderer (`@object-ui/components`), breaking for metadata that was never converted.** The repeater no longer reads `properties.object` / `filter` / `sort` / `limit`, or the same four keys in the legacy `props` bag, as the binding's fallback. A node that carries only the flat keys now issues no query and shows its empty state. Beside a binding, the flat keys no longer AND a filter in or supply a sort or a cap. A binding-bound repeater renders as before: the binding's own `sort` and usable `limit` win, a named saved view supplies the baseline, and the two filters are AND-combined. The spec's protocol-18 conversion (`element-flat-data-binding-to-data-source`) moves stored flat keys onto the binding.
- **Console (`@object-ui/console`).** The `DevLists` dev route, the last in-repo producer of the flat keys, writes `dataSource: { object: 'showcase_category', limit: 10 }`. Its nodes are typed `DeclaredNode` literals instead of `as any` casts, so the authoring face checks them.
- **Types (`@object-ui/types`).** A doc comment on `ElementRepeaterBlockSchema` no longer describes the removed fallback read. No type or schema changes.
