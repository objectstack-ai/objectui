---
'@object-ui/components': minor
---

fix(filter-builder): the operator trigger names the operator the row holds, in any spelling of it

The operator `Select` compared its value LITERALLY against the mounted
`SelectItem`s, whose ids are this builder's own camelCase vocabulary
(`greaterThan`, `notIn`). A condition row can legitimately carry the same
operator under another spelling — `@objectstack/spec`'s canonical
`greater_than`, which is what `FilterOperatorSchema` accepts and what
`foldFilterGroupToSpecRules` persists, or the spec's alias table `gt` / `lt` /
`eq`, which three schema-catalog entries author today. Neither matched, so
Radix drew a **blank** operator cell over a row that went on filtering
correctly: the user's own operator, invisible and unreachable.

Everywhere the operator's *meaning* matters this component already folded
through the spec's `normalizeFilterOperator` (`filterValueArity`,
`reconcileOperatorForField`). The one site that did not was this identity
comparison, and that omission — not the two vocabularies diverging — is what
produced the blank. It now folds too, and hands the trigger the *mounted*
spelling.

**Rendered output moves** — that is the point of the fix, and it is the only
thing consumers can observe. A previously empty operator cell now carries its
label; measured through the real `SchemaRenderer` on the affected catalog
entries, `text` and the SHA-256 of it change while the element count and tag
census do not:

```
before  … Clear all Category Remove condition Price Remove condition …
after   … Clear all Category Equals Remove condition Price Less than …
```

A consumer holding a DOM or text snapshot of a filter row whose operator was
stored in the canonical or alias dialect will see that snapshot move. Nothing
else does — which is why this is `minor` and carries **no** `**BREAKING**`
marker:

- no schema accepts or refuses anything it did not before;
- no id any stored filter carries is rewritten, on render or otherwise;
- the vocabulary the dropdown EMITS is byte-identical — no second spelling is
  mounted, so `onChange` still hands back `lessThan` and never `lt`;
- an operator no offered id folds onto still draws blank, because inventing a
  label for a word this vocabulary does not contain would be a claim rather
  than a repair.

Which of the two vocabularies should win remains open and is deliberately not
answered here (objectui#7561).
