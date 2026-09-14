---
---

Internal refactor only — releases nothing.

`packages/app-shell` held six declarations under names `@objectstack/spec` also
exports (objectui#7265). Four are now bound to the spec (imported, `Partial<>`-
derived, or `Pick<>`-projected) and three were renamed off the spec's name
because they model a different layer. The ledger in
`scripts/check-spec-symbol-derivation.mjs` was regenerated mechanically.

Declared as releasing nothing because that was MEASURED, not assumed, on this
branch's head:

- the built `.js` tree is byte-identical before and after — all 461 emitted
  files, `diff -rq` exit 0. Everything this diff touches is a type or a comment,
  and both are erased. The same command reported three differences on the
  `.d.ts` pass in the same session, so it is an instrument that can report one;
- no name enters or leaves the published export set;
- of the three `.d.ts` files whose BYTES move, two are identical once comments
  are stripped and the renamed identifier is substituted — and neither
  identifier was ever exported, so no consumer can name it;
- the third replaces a hand-written interface with `Pick<>` of the spec's shape.
  That one reaches consumers through the exported `UseTrackRouteAsRecentOptions`,
  so it is pinned at compile time to the exact shape the interface declared
  (`spec-symbol-parity.test.ts`), and that pin was shown to fail when falsified.
