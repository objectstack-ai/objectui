---
'@object-ui/app-shell': patch
---

An `app` page that declares a `record` binding now reads that row, and its components' `visibleWhen` predicates read it as `record` (objectui#12931, the renderer half of objectstack#24265).

`@objectstack/spec`'s `PageSchema.record` is a one-row query, `{ object, view?, filter?, sort? }`, placed on `type: 'app'` pages only. The console page host reads the FIRST row of that set under its `sort`, once per page open, through the page's own data adapter and so under the caller's identity. The named view and the filter are resolved the way a block's own `dataSource` binding resolves them, and so are the filter's placeholder tokens such as `{current_org_id}`. A write to the bound object re-reads the row in place.

A count or a plan is a field on that row, not a root of its own: `record.env_count >= 2` reads a `summary` roll-up, and `record.plan != 'free'` reads the object's own plan field.

- **While the row loads**, the page shows its loading state and draws no component, so no predicate shows a block and then hides it, or the other way round.
- **With no row**, or when the server refuses the read, `record` is `null`, so `record == null` holds.
- **When the read fails**, the page shows the record page's "Couldn’t load this record" state with Retry, and no component.

A page with no binding, and any page that is not an `app` page, keeps exactly the predicate scope it had: no read and no `record`. Nothing is added to the package entry: no export, prop, type member or language-pack key.
