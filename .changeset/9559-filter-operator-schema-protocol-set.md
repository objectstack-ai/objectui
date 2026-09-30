---
'@object-ui/types': minor
---

feat(types): `FilterOperatorSchema` is the protocol's operator set, and normalises aliases on parse

`FilterOperatorSchema` — the validator for a `filter-builder` condition's `operator` —
was a 14-member local list that had fallen six members behind `@objectstack/spec`
(`icontains`, `is_empty`, `is_not_empty`, `before`, `after`, `between`) and refused every
legacy spelling the protocol accepts. So `safeValidateSchema` (and `objectui validate`)
refused filters that the protocol's own `ViewFilterRuleSchema` and the runtime both
accept (objectui#9559, ruling B).

⚠️ **Dated note, 2026-09-25 — `objectui check` did not refuse them — objectui#10524.**
This entry first listed `objectui check` beside `objectui validate`. `check` is an
advisory sweep: it never parses against the schema a file whose root carries a structural key (`children`,
`className`, `body`, …), it lists a file with none of those keys by name when the file
does not validate, and it exits non-zero on unreadable JSON only. The verdict is
`objectui validate`'s.

It is now the spec rule's own `operator` member — `VIEW_FILTER_OPERATORS` plus the spec's
alias fold, taken from `@objectstack/spec/ui` instead of copied — so it cannot fall behind
again:

- every canonical member of `VIEW_FILTER_OPERATORS` is accepted;
- every legacy spelling in the spec's alias table (`lessThan`, `greaterOrEqual`, `gt`,
  `isNull`, …) is accepted **and normalised**;
- everything the protocol refuses is still refused (`containsCaseInsensitive`, `exists`
  and `notExists` among them).

**The visible change: the stored shape of a parsed document.** An authored camelCase or
shorthand operator now parses to its canonical spelling — a condition authored
`{ operator: 'greaterOrEqual' }` comes back from `FilterBuilderSchema.parse` as
`{ operator: 'greater_than_or_equal' }`. A caller that parses and then writes the result
back stores the canonical spelling.

**Type and shape changes.** `FilterBuilderOperator` is now the spec's `ViewFilterOperator`
(the 20 canonical members; it used to be a 14-member local union carrying `is_empty` /
`is_not_empty` but not `is_null` / `is_not_null`). `FilterOperatorSchema` is now a
preprocess pipe rather than a `ZodEnum`, so it has no `.options`: the canonical members are
`FilterOperatorSchema.out.options`. Breaking in semantics for code that read `.options` or
relied on an alias being refused; released as `minor` under this repository's
version-alignment rule.
