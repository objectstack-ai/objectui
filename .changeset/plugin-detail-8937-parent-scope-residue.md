---
'@object-ui/plugin-detail': patch
---

docs(plugin-detail): correct the shipped README's parent-scope claim and the false driver-arity docblock (objectui#8937)

Two published texts that objectui#8886 left behind, both measured false on `origin/main`:

- **`README.md` (it is in `files[]`, so it ships).** It said the node's `filter` is
  AND-combined with `{ [relationshipField]: parentId }`, full stop. Since objectui#7299
  the parent condition is compiled to match the relationship field's arity, so a
  multi-valued relationship gets `{ [relationshipField]: { $contains: parentId } }`
  instead. The paragraph now states both spellings and names the arbiter
  (`@objectstack/spec/data`'s `isMultiValueField`).
- **`parentRelationshipFieldDef`'s docblock, and the same sentence in the
  objectui#7299 test header.** They said the SQL driver decides arity on the spec's
  `isMultiValueField`. It does not: `driver-sql` gates the equality family on its own
  storage question, which reads `multiple` as truthy on ANY type. The two rules
  therefore disagree for a type outside `MULTI_CAPABLE_TYPES` carrying
  `multiple: true`, and that divergence is now recorded as a divergence and pointed at
  the upstream card that owns it (objectstack#17469).

No predicate moved and no wire changed — this release carries corrected published text
only. Both claims are now pinned by re-derivation rather than transcription
(`relatedListParentScopeResidue-8937.test.ts`).
