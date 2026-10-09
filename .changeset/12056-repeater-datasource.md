---
'@object-ui/app-shell': patch
---

The page designer writes a repeater's query into its node-level `dataSource` binding, as it already does for `element:number` (objectui#12056, the repeater half of objectui#11880).

In the page-block inspector, an `element:repeater`'s Object picker now writes `dataSource.object` and its Limit box writes `dataSource.limit`. They used to write `properties.object` and `properties.limit`, the flat keys `@objectstack/spec` retires in v18 (objectstack#11509). The repeater's Title field and Fields pickers now list the fields of the object in `dataSource.object`. The Empty text and Dividers between rows controls still write `properties`. The repeater's renderer already reads the binding first (objectui#11880).

A repeater already stored with a flat `properties.object` or `properties.limit` is not migrated. The inspector shows the binding's values in the curated controls, and a stored flat key stays visible and editable under Advanced.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The controls keep their existing labels.
