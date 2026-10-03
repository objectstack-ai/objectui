---
'@object-ui/plugin-grid': patch
---

docs(plugin-grid): authored `object-grid` examples write their props in the `properties` bag (objectui#11276)

The README's authored `object-grid` examples now write `{ "type": "object-grid", "properties": { … } }`, the spelling `@objectstack/spec`'s `ComponentPropsMap['object-grid']` row declares and `objectui validate` now requires, each bag checked with `satisfies ObjectGridProps` (the spec's row type). `emptyState` is described as what it is today: a key `ObjectGrid` reads that the spec's row does not declare, so not authorable in a document. The examples that mount `ObjectGrid` directly keep the flat `schema` prop: a component mounted without `SchemaRenderer` receives the node as it reads it, and nothing hoists a bag there. Under `src/`, a new render pin holds that the bag and a stored flat node draw the same grid, and the CRUD-guide render pin reads the guide's bag. No runtime change.

**Correction, 2026-10-03 (objectui#11227).** The README no longer describes `emptyState` as
not authorable: `@objectstack/spec` 17.6.0 declares it, with `description`, on the `object-grid`
row, so both are written in the `properties` bag, and the README's example shows them there
(`.changeset/11227-object-grid-17-6-keys.md`).
