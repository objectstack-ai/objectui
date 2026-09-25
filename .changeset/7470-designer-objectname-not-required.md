---
'@object-ui/plugin-map': patch
'@object-ui/plugin-gantt': patch
---

fix(plugin-map, plugin-gantt): the registrations no longer declare `objectName` a required input

Both renderers read their records from one of three keys (`data`, then
`staticData`, then `objectName`), and the `object-map` / `object-gantt` zod schemas
enforce "one of the three" through `requireRecordSource` (objectui#6939). The
registrations' designer-facing `inputs` still said `objectName` was required, on
`object-map`, `map` and `object-gantt`, so the html tier's validator reported a
`missing-required-prop` error on a block authored on `staticData` or `data` that
the schema accepts and the renderer draws.

`objectName` is now declared without `required`, and its description states the
rule: the record source is one of `data`, `staticData` and `objectName`, and the
schema refuses a block that declares none of them. No one-of form was added to the
input declaration; the zod refinement stays the place that enforces it. The
renderers' read order is unchanged. The `@object-ui/plugin-gantt` README sentence
that called `objectName` required is corrected (objectui#7470).
