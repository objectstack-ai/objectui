---
'@object-ui/plugin-list': minor
---

The list view's live query sends "Is empty" / "Is not empty" as the spec's `isempty` / `isnotempty` instead of an equality to `null` (objectui#10813). `@objectstack/spec` 17.6.0 and later lower that pair to `$empty`; an earlier reader lowers it to `$null`, as it does the saved view's `is_empty`.

`convertFilterGroupToAST` resolved the pair to `[FIELD, '=', null]` / `[FIELD, '!=', null]`, a null-only test, before `mapOperator` was consulted. The same rule saved into the view is persisted as `is_empty`, which `@objectstack/spec` 17.6.0 lowers to `$empty` (objectstack#20446): so one filter panel answered two record sets, depending on whether the view had been saved. The pair now takes the value-less path like `is_null`, and `mapOperator` gains `isempty` / `isnotempty` arms. The node is `[FIELD, 'isempty', null]`; the spec discards the third slot.

**What moves.** Nothing is stored by this path. Against a 17.6.0 or later server, on a text-like column a row holding `''` is now "empty", and on a multi-value column a row holding `[]` is, matching the server's per-type answer for the saved view. On a `provider: 'value'` list a row with no key at all is now "empty" too: the equality to `null` did not select it there.
