---
'@object-ui/core': minor
---

`convertFiltersToAST` accepts `$icontains`, the canonical case-insensitive `contains`
the rest of the stack already spoke (objectui#8976).

`$icontains` is a member of `@objectstack/spec`'s `FILTER_OPERATORS`, `ValueDataSource`
executes it, `FilterConditionField` emits it for its "contains (ignore case)" builder
row, and `packages/core/src/adapters/README.md` prescribes it as the repair when
`$like` / `$ilike` / `$regex` are refused. `convertOperatorToAST` had no row for it, so
the ObjectStack lowering path answered a `FilterOperatorError` (`code:
'INVALID_FILTER'`, `httpStatus: 400`) with the generic unknown-operator paragraph — the
one spelling this repo tells an author to write was the one spelling it rejected. An
admin who picked "contains (ignore case)" in the filter builder authored criteria that
the in-memory matcher honoured and the ObjectStack data source refused.

`{ name: { $icontains: 'john' } }` now lowers to `['name', 'icontains', 'john']`. The
value is an identity because `icontains` is itself a member of the spec's
`VALID_AST_OPERATORS`: unlike `$startsWith` → `startswith` there is no case to squash,
and the spelling the author writes is the spelling the AST carries. No existing filter
changes shape — this is a refusal becoming an acceptance, so nothing that lowered
before lowers differently now.

Two smaller repairs ride along, both consequences of the same gap. The
unknown-operator message now enumerates `$icontains` among the supported operators, and
the `$regex` refusal now prescribes it by name for a case-insensitive substring —
`@objectstack/spec`'s own `FILTER_TEXT_CASES` requires that refusal to mention
`$icontains`, and it could not while the converter did not accept it.

This is the opposite leg of objectui#8568, which retired four lowercase aliases the
converter accepted and the matcher refused. There the converter was more tolerant than
the contract; here it was less tolerant than it. The two needed different fixes: a
single "make the two sides agree" change would have widened the matcher instead.
