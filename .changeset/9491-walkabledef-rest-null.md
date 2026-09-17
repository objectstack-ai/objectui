---
'@object-ui/types': patch
---

Declare `WalkableDef.rest` as `z.ZodType | null` (objectui#9491).

`packages/types/src/zod/node-derivation.ts` declares the def member set both zod walkers
in this package read. It declared `rest?: z.ZodType` — i.e. `z.ZodType | undefined` — while
zod 4 spells "this tuple has no rest element" as an OWN `rest` key holding `null`, minted by
`const rest = hasRest ? _paramsOrRest : null` in its `tuple` factory.

**This is the declaration, not a behaviour change.** Nothing here changes what either walker
does with the value; the accept set of every exported schema is untouched. objectui#9088
already repaired the one arm the inaccurate type misled — the `tuple` arm in
`zod/imported-defaults.ts`, which normalised the absent case to `undefined` because the
declared type said that was the absent case, and so rebuilt every rest-less tuple through a
`===` comparison that could never match. This change corrects the type that licensed it, so
the next arm written against it is told the truth and `tsc` agrees with the truth instead of
with the mistake.

One read needed adjusting, contrary to the expectation the card recorded: the local
`unchanged` helper in `zod/imported-defaults.ts` declares its comparison pairs
`z.ZodType | undefined`, and the objectui#9088 repair hands it `def.rest` RAW — comparing
like with like is the whole of that repair. Its parameter now admits `null` too. The
comparison itself is still `===`: `null` matches only `null`, `undefined` only `undefined`.

`WalkableDef` is emitted into the published `dist/` but is reachable through no entry in the
package `exports` map, so no consumer outside this package can name the widened member; the
new pin `types/src/__tests__/walkable-def-null-mint-9491.test.ts` re-derives against the
INSTALLED zod that `rest` is minted `null` and that no other member the walkers read ever is,
so a zod bump that moves either half goes red here.
