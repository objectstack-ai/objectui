---
'@object-ui/plugin-list': patch
---

fix(plugin-list): list filters label a lookup's values by the `displayField` the object definition declares (objectui#10545)

Once a list view's object definition loads, the filter builder's candidates and
the toolbar's lookup filter read each lookup field's display field off that
definition. They read `display_field`, then `reference_field`, and never
`displayField`, the only one of the three `@objectstack/spec`'s `FieldSchema`
declares. So a spec-compliant lookup's display field never reached the value
picker, which fell back to its default, `name`.

Both now read `displayField`, and only it. This is the same single spelling
`@object-ui/plugin-grid` reads off a definition. `FieldSchema` refuses the other
two: `display_field` with a rename to `displayField`, and `reference_field` with
a pointer to `referenceVia`.

Behaviour change: a field definition that carries only the refused
`display_field` no longer sets the picker's display field, and neither does one
that carries only `reference_field`. The picker falls back to `name`. A stored
definition served through the ObjectStack adapter still works, because that
adapter folds `display_field` onto `displayField` when the schema is loaded.
A definition that reaches the list any other way, such as a host `DataSource`
or an `objectDef` passed straight to `UserFilters`, needs `displayField`.

The two readers also stop reading `id_field` as the lookup's id column.
`FieldSchema` declares no id column for a lookup and refuses both `id_field` and
`idField`, so the picker now always keys a lookup by `id`, its default. A
definition that carried `id_field` used to make the picker match and emit that
column's values instead.

Also (objectui#10547): before a list view's object definition loads, the filter
builder's candidates come from the view's declared `columns`, and that fallback
no longer reads `options` off a list column. `ListColumnSchema` refuses the key
with `unrecognized_keys`, so a spec-compliant view never carries it. A select
field's options now reach the filter builder only from the object definition,
once it loads, which is where they already came from after the load.
