---
'@object-ui/components': patch
---

fix(components): `FilterBuilder`'s value-input gate folds the operator, so one operator draws one row whichever spelling it arrives in (objectui#9302)

`needsValueInput` did a raw `has()` against `VALUELESS_FILTER_BUILDER_OPERATORS`,
whose members are this builder's six camelCase dropdown ids. A row carrying the
spec's CANONICAL spelling — `is_null`, `is_empty`, `is_not_null`,
`is_not_empty`, which is what `foldFilterGroupToSpecRules` persists and what any
spec-side producer emits — missed the set and was treated as value-taking. The
row drew a box to type a value into, directly beside a trigger reading
`Is null`. Measured through the real builder on one `text` column: the canonical
spelling drew **1** value input where its camelCase twin drew **0**, with
`equals` drawing 1 in both (it really does take a value).

Both sides of the lookup now fold through the spec's `normalizeFilterOperator`.
That is the same fold `filterValueArity` and `reconcileOperatorForField` in this
component already perform, so this is one more site joining a fold the file does
rather than a new dialect, and the canonical set is DERIVED from the exported one
rather than restated beside it.

Pre-existing, and objectui#7561 did not cause it: before that repair the same
stray input was drawn under a **blank** trigger. What changed is that the
contradiction became legible.

**The exported set is unchanged, deliberately.** Its stated job is *which rows
this builder leaves value-less* — a fact about the dropdown's own ids — and two
other layers read it: `plugin-list`'s `convertFilterGroupToAST` (what the live
grid queries) and `app-shell`'s `foldFilterGroupToSpecRules` (what a saved view
persists, already documented as this set plus the canonical spellings only that
layer sees). Widening it here would have made that layer's deliberate
compensation redundant by side effect, in a file nobody is editing. The defect
was never a set missing members; it was a reader that forgot to normalize its
input, so the reader is what was repaired. No published type or export changes,
and no row's stored `operator` is rewritten — rendering is not an edit.

Which operator vocabulary should WIN is a separate, still-open question and is
not decided here. The `contains` / `icontains` boundary is untouched and pinned:
the fold this gate routes through maps neither onto the other.
