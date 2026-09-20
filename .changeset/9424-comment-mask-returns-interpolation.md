---
---

Tooling only, no runtime change and no behaviour change: `scanSource` in
`scripts/js-comment-mask.mjs` now declares the third property it has always returned
(objectui#9424).

`tsconfig.scripts.json` compiles `scripts/**` with `allowJs: true` and `checkJs: false`
deliberately (objectui#3494), so a `.ts` consumer's type for this helper is inferred from
the `.mjs` source steered by JSDoc — the docblock IS the type. Its `@returns` named two
properties, `comment` and `literal`, while the function returns three:
`return { comment, literal, interpolation };`. The declared return was therefore narrower
than the real one, and `scanSource(src).interpolation` was a compile error on a property
that genuinely exists and is genuinely populated — the delimiter-reachability flag array
whose post-processing keeps `check-entry-guard.mjs`'s statement slicer in sync.

Measured before and after on the same tree with `ts.createProgram` under the real project
options: reading `.interpolation` went from `TS2339: Property 'interpolation' does not
exist on type` to no diagnostic at all, while reading a property the function genuinely
does not return stayed `TS2339` in both runs — and its message now enumerates all three
real properties. That second half is the load-bearing one: it is what separates "widened
to the true shape" from "widened into an index signature where anything reads clean".

The function body is byte-identical (sha256 of the declaration through its own closing
brace is `8e715c3a20dc63fc` before and after); only the docblock moved.
`js-comment-mask-returns-interpolation-9424.test.ts` pins both directions so a future
edit that drops the tag, or one that loosens the shape into `any`, goes red.

The `@typedef` question the filing card raised is deliberately NOT taken here. Measured
over every direct `scanSource(` call in the code of all 4,947 tracked JS/TS-family files
(comments stripped by the module's own `stripComments`): 32 call sites, 18 destructured at
the call site, 10 a single member read at the site, and **zero** that bind the whole result
to a name or annotate its shape — so nothing in the tree needs a name for it, and no
hand-written type duplicates it. A named typedef would add a second declaration site with
no reader, which is the same class of drift this change exists to close.
