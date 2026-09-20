---
---

Corpus + test-only (objectui#6939): the three `components-complex-filter-builder`
schema-catalog entries now spell `conditions[].operator` with the members
`FilterOperatorSchema` declares (`equals` / `less_than` / `greater_than`) instead
of the spec's alias table (`eq` / `lt` / `gt`), so they pass
`safeValidateSchema`. Contract-first: the protocol declares the snake_case
vocabulary and the corpus was the side that was wrong — no enum member was
added, and no published type, export or runtime path moved. The two pins in
`@object-ui/types` and `@object-ui/components` that recorded the old corpus
state are re-aimed (and, where they were fences for objectui#7561's narrower
scope, inverted rather than deleted) so they still name the key that moved.
Rendering is unchanged, which is this change's acceptance rather than a
side-effect: objectui#7561 had already routed the operator trigger through
`normalizeFilterOperator`, so all three dialects drew the same label before the
rewrite and must still draw it after.
