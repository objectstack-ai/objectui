---
'@object-ui/types': patch
---

`stripImportedDefaults` no longer rebuilds a rest-less tuple that had nothing to
strip (objectui#9088).

The walker documents an identity property about itself: a node is rebuilt ONLY if
the walk actually changed something beneath it, so a subtree with no `ZodDefault`
in it comes back **reference-equal** to `@objectstack/spec`'s own object. That is
decision batch #90's reversibility argument made literal — it is why option A was
taken over option B — and it was false for every tuple with no rest element.

Zod 4 spells "no rest element" as an OWN `rest` key holding `null`, not as an
absent key. The `tuple` arm normalised that case to `undefined` before comparing,
and the comparison is `===`, so `null === undefined` was false for **every**
rest-less tuple regardless of its items and the arm always took the rebuild
branch. The arm now copies `def.rest` instead of normalising it, so `null` is
compared against `null`.

**What changes for a consumer.** Three schema-shaped exports reachable from the
published `@objectstack/spec` surface stop being rebuilt at this package's import
boundary and are now handed back as the spec's own objects:
`@objectstack/spec/data#FieldOperatorsSchema`,
`@objectstack/spec/data#RangeOperatorSchema` and
`@objectstack/spec/ui#ListMapConfigSchema`. Nothing about what they accept or
reject moves — the rebuild was faithful, and a rest-less tuple validated
identically before and after. What moves is reference identity: code comparing
one of these against the spec's export with `===` / `toBe` now finds them equal
where it previously found them distinct.

No accept set, no key, no check and no registry metadata changes.
