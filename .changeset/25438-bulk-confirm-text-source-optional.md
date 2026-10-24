---
'@object-ui/types': patch
---

`BulkActionDef.confirmText`'s template envelope types `source` as optional, as `@objectstack/spec`'s `Expression` does, and so does its zod twin (objectstack#25438).

`@objectstack/spec` made a bulk action's `confirmText` a `template` slot (objectstack#24947), and its envelope carries `source` or `ast`. With `source` typed as required, `@object-ui/plugin-view` refused the spec's own bulk action type when it handed a named view's `bulkActionDefs` to the grid, so the console no longer built against the current spec. The confirm step is unchanged: an envelope with no `source` shows the default sentence ("This will apply to N record(s).").
