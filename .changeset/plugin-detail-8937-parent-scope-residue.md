---
'@object-ui/plugin-detail': patch
'@object-ui/core': patch
---

docs(parent-scope): state the driver's real arity rule, and the arity-dependent parent scope in the shipped README (objectui#8937)

Two published texts that objectui#8886 left behind, both measured false on `origin/main`:

- **`packages/plugin-detail/README.md` (it is in `files[]`, so it ships).** It said the
  node's `filter` is AND-combined with `{ [relationshipField]: parentId }`, full stop.
  Since objectui#7299 the parent condition is compiled to match the relationship field's
  arity, so a multi-valued relationship gets
  `{ [relationshipField]: { $contains: parentId } }` instead. The paragraph now states
  both spellings and names the arbiter (`@objectstack/spec/data`'s `isMultiValueField`).
- **The claim that the SQL driver decides arity on that same predicate.** It does not:
  `driver-sql` gates the equality family on its own storage question, which reads
  `multiple` as truthy on ANY type. The two rules therefore disagree for a type outside
  `MULTI_CAPABLE_TYPES` carrying `multiple: true`. objectui#9184 moved the arity compiler
  into `@object-ui/core`'s `parent-scope` seam and carried the claim with it, so the
  correction is recorded there — the seam now states the driver's measured rule, records
  the divergence as a divergence, and points at the upstream card that owns which of the
  two rules is right (objectstack#17469). `RelatedList.tsx`'s pointer comment and the
  objectui#7299 test header carried the same sentence and are corrected to match.

No predicate moved and no wire changed — this release carries corrected published text
only. All three claims are pinned by re-derivation rather than transcription, in
`relatedListParentScopeResidue-8937.test.ts`.
