---
'@object-ui/types': patch
---

`stripImportedDefaults` no longer drops the `.describe()` of the schemas it imports from `@objectstack/spec`.

A zod 4 description is registry state keyed by the node, not `def` state, so neither of the boundary's two derivations carried it: `.removeDefault()` returns the inner node (the protocol spells its guidance `.default(v).describe(d)`, so `d` sat on the outer node that was discarded), and `cloneWithDef` builds `new Ctor({...def})`, which copies `def.checks` faithfully and the description not at all. Measured across spec 17.4.0: 2024 of 2024 described `ZodDefault` nodes and 1364 described container nodes reached this package with no description; after the fix, 0 are lost.

Both derivations now go through one rule, `withDescriptionOf`. The identity property is unchanged — a subtree with no `ZodDefault` in it still comes back reference-equal, and the count of reference-equal nodes across the published spec surface is the same before and after.
