---
---

Measure the two LOCAL mirrored-but-undeclared keys the `MirroredUndeclared`
ledger carries — `views.zod.ts#DetailViewFieldSchema`'s `dueLike` and
`objectql.zod.ts#ObjectGridSchema`'s `operators` — per key, for objectui#9729's
at-tier contract review. Test only; no package is released by this change, and
neither published accept set moves: the remedy for each key (declare it on the
twin, or narrow the mirror) is the decision this measurement exists to inform.

Also corrects the ledger entry for `dueLike`, which justified itself with a
package-wide name grep. `field-types.ts` does declare that name — on
`DateFieldMetadata` and `DateTimeFieldMetadata`, not on this pair's twin. The
measurement was right and its stated reason was not: a name is not a key.
