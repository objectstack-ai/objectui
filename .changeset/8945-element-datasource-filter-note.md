---
'@object-ui/core': patch
---

docs(core): the `ElementDataSourceConfig.filter` note now separates what an author may write from what a renderer may still receive (objectui#8945)

The note said "three shapes legitimately reach a renderer here" — a MongoDB-style
record, an ObjectQL AST tuple array and a spec `ViewFilterRule` array — and typed
`filter` as `unknown` "rather than the spec's `FilterCondition`". Since the spec's
`filter` doors converged on the rule array (objectui#6206; migration
`element-data-source-and-object-block-filter-rule-array`), that sentence mixes two
populations the convergence split apart:

- **What an author may write** is the `ViewFilterRule` array alone,
  `[{ field, operator, value }, …]`. `ElementDataSourceSchema` refuses the record
  form by kind and refuses an AST tuple array because each member must be a rule
  object.
- **What a renderer may still receive** is all three. The D2 conversion
  `page-component-filter-record-to-rule-array` rewrites a stored `filter` only
  where the rule array spells it losslessly (a flat record, an operator object
  whose operators the rule vocabulary spells, several such keys, or a
  single-level AST tuple array), on every ObjectStack stored-row read and under
  `os migrate meta --stored`. It leaves exactly as stored a filter carrying
  `$and` / `$or` / `$not`, any filter with a part that has no lossless rule
  spelling (a `null` value, `$null` / `$exists` or an AST `like`, an array or
  object comparand in equality position, an AST `and` / `or` group), and every
  filter of a component whose rows are inline. This renderer is backend-agnostic
  and replays no conversion itself; only ObjectStack's own data-at-rest seams do.
  So all three shapes may still arrive, and `mergeFilterNodes` still lowers each
  of them.

The note now states both, names the spec's type as `ViewFilterRule[]` rather than
`FilterCondition`, and keeps `filter` typed `unknown` for the reason it always
had: this interface carries stored values, and narrowing it would only move the
cast. The module's example binding writes `"filter": [ … ]` instead of the record
form it used to show.

Comments only. No type, export, runtime behaviour or accepted set changes.
