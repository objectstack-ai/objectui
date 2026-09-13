---
'@object-ui/plugin-list': patch
---

fix(plugin-list): `convertFilterGroupToAST` folds the operator, so a saved view spelled canonically queries the filter it shows (objectui#9359)

NOT cosmetic, and not a new defect: a list view whose stored filter used the
spec's canonical operator spelling QUERIED WITH NO FILTER AT ALL and returned
every record, while the filter panel showed the condition applied. Nothing
errored and the result set looked plausible.

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

The canonical spelling is not exotic — it is what `foldFilterGroupToSpecRules`
persists when the user saves the panel's group as a view, and what any
spec-side producer emits. So a saved view could PERSIST correctly and still
QUERY as though it had no filter.

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
