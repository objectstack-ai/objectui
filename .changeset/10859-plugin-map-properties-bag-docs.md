---
'@object-ui/plugin-map': patch
---

docs(plugin-map): authored `object-map` examples write their props in the `properties` bag, and the `objectName` input names the `dataSource` binding (objectui#10859, batch 5)

- The README's authored `object-map` examples now write `{ "type": "object-map", "properties": { … } }`, the spelling `@objectstack/spec`'s `ComponentPropsMap['object-map']` row declares and `objectui validate` now requires. The example that mounts `ObjectMap` directly keeps the flat `schema` prop: a component mounted without `SchemaRenderer` receives the node as it reads it, and nothing hoists a bag there.
- The registration's `objectName` input description names the node's `dataSource` binding beside `data`, `staticData` and `objectName` as a record source, because the authored arm now counts it. No runtime change.
