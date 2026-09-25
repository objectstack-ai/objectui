---
'@object-ui/components': minor
'@object-ui/fields': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-view': minor
'@object-ui/i18n': minor
---

The `FilterBuilder` dropdown speaks the protocol's operator ids (objectui#9306).

`defaultOperators` now emits the twenty members of `@objectstack/spec`'s
`VIEW_FILTER_OPERATORS`, spelled as the spec spells them (`not_equals`,
`greater_than_or_equal`, `is_null`, `icontains`, …), plus the two opt-in
existence ids `exists` / `notExists`, which the protocol has no member for and
which stay unfolded (objectui#9559 ruling B). The camelCase ids the dropdown used
to emit (`notEquals`, `greaterOrEqual`, `isNull`, …) are the spec's deprecated
alias form (objectui#7993); `containsCaseInsensitive` is the one former id the
spec's alias table has no row for, and the builder reads it itself (below).

**Stored filters keep loading.** The builder folds a stored spelling at its read
boundary, through the spec's `normalizeFilterOperator` plus one local row the
spec's alias table lacks (`containsCaseInsensitive` → `icontains`,
objectstack-ai/objectstack#20092), and the author's next edit writes the
canonical id back. Opening a stored filter writes nothing. No row changes the
predicate it stores: the sharing-rule criteria, the dataset filter, the saved-view
fold, the live grid and the override recovery pass were each measured over all
22 former ids against the ids they became, and store the same predicate. The only
cells that differ are `icontains` on the three consumers that never offered the
case-insensitive contains (dataset filter, saved-view fold, live grid), where
the old id produced no storable filter at all and the new one does.

**Breaking, stated here because the group never takes a `major`:**

- `@object-ui/components`: the published `FilterBuilderOperator` type NARROWS
  from the camelCase union to the spec's `ViewFilterOperator` plus `'exists' |
  'notExists'` — a `'greaterOrEqual'` literal typed against it no longer
  compiles. `FILTER_BUILDER_OPERATORS` and `VALUELESS_FILTER_BUILDER_OPERATORS`
  hold the canonical ids, and a host's `onChange` receives them. New export:
  `normalizeFilterBuilderOperator`, the builder's read-side fold.
- `@object-ui/components`: `icontains` ("Contains (ignore case)") is no longer
  opt-in. Its old reason — only the Mongo criteria dialect could carry a
  case-insensitive contains — stopped being true when `VIEW_FILTER_OPERATORS`
  gained `icontains` (spec 17.1.0), and `OPT_IN_OPERATORS`' own docblock recorded
  deleting the entry as the planned outcome. It is offered on the text bucket to
  every consumer; `contains` and `icontains` stay two operators (objectui#7379).
- `@object-ui/i18n`: the `filterBuilder.operators.*` keys are re-keyed to the
  canonical ids in all ten packs (`filterBuilder.operators.is_null`, …); every
  translated value is unchanged. A host that overrides one of these keys must
  re-key its override.
- `@object-ui/fields`: `FILTER_CONDITION_EXTRA_OPERATORS` is `['exists',
  'notExists']` — the case-insensitive contains needs no grant any more.
  `FilterConditionField` still writes `$icontains` for it, and its builder rows
  (`kvToCondition`) carry the canonical ids.
- `@object-ui/plugin-view`: `toFilterGroup` emits the canonical ids.

Also in `@object-ui/app-shell`: the dataset inspector's bridge maps `icontains`
to `$icontains`; the drill-down "is null" chip reads the re-keyed label; and the
view-override recovery pass folds a row's operator before its value-less check,
so a stored `{ operator: 'isEmpty', value: '' }` row is kept rather than dropped
as unfinished.
