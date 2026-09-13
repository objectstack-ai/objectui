---
'@object-ui/plugin-list': patch
---

fix(plugin-list): `convertFilterGroupToAST` folds the operator, so a canonical value-less row emits its node instead of being dropped (objectui#9359)

NOT cosmetic, and not a new defect: a filter row carrying the spec's canonical
operator spelling QUERIED WITH NO FILTER AT ALL and returned every record,
while the filter panel showed the condition applied. Nothing errored and the
result set looked plausible.

`convertFilterGroupToAST` read the row's operator RAW, against
`VALUELESS_FILTER_BUILDER_OPERATORS` — the FilterBuilder's six camelCase
dropdown ids. The completeness test it falls through to
(`isFilterValueComplete`) DOES fold, through the spec's
`normalizeFilterOperator`, to decide arity. So the two halves of one predicate
spoke different vocabularies: a row spelled `is_null` missed the value-less
short-circuit, landed on `scalar`, had its `value: ''` read as an unfinished
row, and was dropped. Measured through the real converter on one `text` column:

    isNull   (dropdown id)   ->  ["title","isnull",null]
    is_null  (canonical)     ->  []                        <- the defect
    equals + value "acme"    ->  ["title","=","acme"]      <- control, fires

WHO REACHES THIS READER — measured, not assumed. Its one production caller is
`buildEffectiveFilter`, and the argument it converts is the list toolbar's own
FilterBuilder group: live in the session, or restored per browser by
`writeListFilterState`. Both carry the dropdown's camelCase ids, so the
canonical spelling has no measured producer into this reader today. A SAVED
view does NOT arrive here — its stored `ViewFilterRule[]` travels
`schema.filter` into the base-filter argument of that same call and is lowered
by `@object-ui/core`'s `toFilterNode` / `viewFilterRuleToNode`, which already
folds: `{ field: 'closed_at', operator: 'is_null', value: '' }` lowers to
`["closed_at","is_null",""]`, accepted by `isFilterAST`. So what is repaired is
not a live saved-view outage. It is a reader that contradicted its OWN declared
contract — the comment above it states it accepts both the FilterBuilder
vocabulary and the `@objectstack/spec` `ViewFilterRule` vocabulary, and it
dropped a COMPLETE row of the second one, emitting no filter rather than an
error. A reader that drops a complete row is a defect whether or not today's
saved-view path happens to pre-fold.

This is the same failure objectui#4744 repaired for the dropdown's own
spellings, reached by the other vocabulary. Both raw reads in this function now
fold, as do the two `isEmpty` / `isNotEmpty` arms that resolve to a null
comparison ahead of `mapOperator` — leaving those on literal ids would have
fixed `is_null` and left `is_empty` emitting a different node from its twin,
which is this defect rather than a repair of it. All four canonical spellings
now emit exactly what their camelCase twins emit.

**The exported set is unchanged, deliberately.** It states a fact about what the
BUILDER'S DROPDOWN draws, and `app-shell`'s `foldFilterGroupToSpecRules`
documents its own value-less set as that set PLUS the canonical spellings only
that layer sees. Widening the export would have made that layer's deliberate
compensation redundant by side effect, in a file nobody is editing. The defect
was a reader that forgot to normalize its input, so the reader is what was
repaired — the same shape the sibling repair used at the builder's value-input
gate (objectui#9302). No published type or export changes, and no stored
operator is rewritten: converting is not migrating.

Which operator vocabulary should WIN is a separate, still-open question and is
not decided here. The `contains` / `icontains` boundary is untouched and pinned:
the fold this reader routes through maps neither onto the other.
