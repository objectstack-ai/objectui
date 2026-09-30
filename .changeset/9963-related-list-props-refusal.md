---
'@object-ui/plugin-detail': minor
---

`RecordRelatedListRenderer`'s props type refuses a misspelled key again (objectui#9963).

The renderer's own `schema` member was the `RecordRelatedListComponentProps` mirror
intersected with `Record<string, any>`, and `RecordRelatedListRendererProps` carried
`[k: string]: any` as well. An index signature admits any key at `any`, so a misspelled
declared key — `schema.relationshipValueFeild` — type-checked at every read in the
renderer, cast or not: the refusal the mirror declares stopped one type layer short of
the reads it exists for.

The type is now looser than the mirror in exactly the two places objectstack#6953 needs,
and both are named members instead of an open index: `objectName` is optional (the
`ElementDataSourceGate` wrapper binds it from the binding), and `dataSource` is admitted
as that binding, typed with the gate's own `ElementDataSourceConfig` from
`@object-ui/core`. The documented authoring shape
`{ relationshipField, dataSource: { object, view } }` still type-checks. The host props
are the ones the component reads — `schema`, `className`, `style`, `data-obj-id`,
`data-obj-type`.

**Breaking for TypeScript callers only**, declared `minor` per this repo's version
policy: a typed call site that wrote a key outside that set — a typo, or one of the
three keys the renderer reads through a cast (`requiredPermissions`,
`enforceFieldSecurity`, `redactFields`), which no block the contract maps onto this tag
declares — now fails to compile. The registry path is untouched: `SchemaRenderer`
reaches this component through an untyped registry entry and forwards exactly what it
did before, and the rendered output does not change.
