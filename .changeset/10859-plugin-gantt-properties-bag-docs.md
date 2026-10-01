---
'@object-ui/plugin-gantt': patch
---

docs(plugin-gantt): authored `object-gantt` examples write their props in the `properties` bag (objectui#10859, batch 6)

The README's authored `object-gantt` examples now write `{ "type": "object-gantt", "properties": { …, "gantt": { … } } }`, the spelling `@objectstack/spec`'s `ComponentPropsMap['object-gantt']` row declares and `objectui validate` now requires, with the field mapping in the bag's `gantt` block. The flat field-mapping keys are described as what they are, the handoff `ObjectView` and `ListView` write onto the node they compose. The examples that mount `ObjectGantt` directly keep the flat `schema` prop: a component mounted without `SchemaRenderer` receives the node as it reads it, and nothing hoists a bag there. Under `src/`, a new render pin holds that the bag draws what the flat spelling drew, and the catalog-plans pin reads the catalog entries' bag. No runtime change.
