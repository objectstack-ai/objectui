---
'@object-ui/plugin-form': patch
---

docs(plugin-form): the README's authored `object-form` examples write their props in the `properties` bag (objectui#10859, batch 4)

The multi-step and metadata-route examples now author `{ "type": "object-form", "properties": { … } }`, the spelling `@objectstack/spec`'s `ComponentPropsMap['object-form']` row declares and `objectui validate` now requires. The example that mounts `WizardForm` directly keeps the flat `schema` prop: a component mounted without `SchemaRenderer` receives the node as the renderer reads it after the hoist. No runtime change.
