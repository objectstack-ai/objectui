---
'@object-ui/app-shell': minor
---

The drill `filter[...]` URL dialect can spell "is empty" (objectui#11547).

From `@objectstack/spec` 17.6.0, `parseFilterAST` lowers the view operators `is_empty` / `is_not_empty` to `{ $empty: true | false }` rather than `$null`. A drill composed by `composeDrillFilter` goes through that lowering, so a widget filter saying "is empty" reached the escape hatch's serializer as `$empty`, which had no URL spelling. The condition was dropped from the drill URL, and the list page opened on a superset of what the widget counted. On 17.5.0 the same widget drilled as `filter[<field>][null]=true`.

`drillUrlFilters` now carries the pair on both sides of its one module, as `EMPTY_FILTER`, following the objectui#9159 precedent:

- **write**: `{ $empty: true | false }` becomes `filter[<field>][empty]=true|false`. It is written beside any `[null]` param and any range bound on the same object, never instead of them. A non-boolean `$empty` writes nothing.
- **read**: on the ADR-0055 `/data` surface that param becomes `[field, 'is_empty', true]` or `[field, 'is_not_empty', true]`, the triples `convertFiltersToAST` emits for the same objects. The data sink lowers them back to `$empty`. Any other value is dropped, as for `[null]`.
- **chip**: each direction hands out the filter builder's existing `is_empty` / `is_not_empty` operator key, which every locale pack already translates. No new string is authored.

The range maps are unchanged. `is_empty` and `is_not_empty` are canonical `ViewFilterRule` words, so "Save as view" keeps the condition. Removing the chip clears the param through the existing prefix delete. Every spelling that worked before is written byte-identically.
