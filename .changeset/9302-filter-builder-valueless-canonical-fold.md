---
'@object-ui/components': patch
---

fix(components): `FilterBuilder`'s value-input gate folds the operator, so one operator draws one row whichever spelling it arrives in (objectui#9302)

`needsValueInput` did a raw `has()` against `VALUELESS_FILTER_BUILDER_OPERATORS`,
whose members are this builder's six camelCase dropdown ids. Every OTHER
spelling the spec publishes for those same operators missed the set and was
treated as value-taking — the canonical members of `VIEW_FILTER_OPERATORS` that
those ids fold onto, which is what `foldFilterGroupToSpecRules` persists and what
any spec-side producer emits, and every row of `VIEW_FILTER_OPERATOR_ALIASES`
pointing at one of them. The row drew a box to type a value into, directly beside
a trigger reading `Is null`.

Which spellings those are is deliberately not listed here. The pin walks those
two published tables and names every row it measured, so the population is
re-derived on each run rather than restated in prose that cannot move with it —
an earlier draft of this changeset hand-listed that population and undercounted
it, which is why it is named by instrument here (objectui#9302). Measured
through the real builder on one `text` column, before the repair: every
spelling the pin's own `firing` filter yields — the enumerated rows that are
not themselves members of the exported set, so each has a DIFFERENT spelling as
its twin — drew **1** value input where that camelCase dropdown twin drew **0**,
with `equals` drawing 1 in both arms (it really does take a value) — the firing
control that makes a uniform zero a reading rather than a dead harness.

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
