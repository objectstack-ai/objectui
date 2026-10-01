---
'@object-ui/app-shell': patch
---

The flow designer's edge `condition` type now mirrors the server's edge slot, the spec's `EvaluatedExpressionInput` (objectui#8946).

`FlowDesignerEdge.condition` imported the spec's `ExpressionInput`, which is the input type of the persistence contract: `ExpressionInputSchema` accepts an envelope with a `source` OR an `ast`. Since objectstack#15807, the server's `FlowEdgeSchema.condition` composes the narrower `EvaluatedExpressionInputSchema`, which requires a non-blank `source`. So the designer's type admitted an `ast`-only condition, `{ dialect: 'cel', ast }`, that the server refuses at parse. That is the drift the type's own docblock said importing prevents. The member now imports `EvaluatedExpressionInput` from the installed `@objectstack/spec` 17.5.0, and its docblock names both contracts and which one it mirrors.

The same change reaches three neighbours:

- `SimEdge.condition`, the flow simulator's copy of the same slot, moves to the same type. A compile-time pin already requires it to equal the canvas's type.
- `conditionText`, the one reader for an edge guard and for every other expression-shaped value an inspector edits, now declares the persistence contract (`ExpressionInput`) as its parameter. It no longer borrows the edge member's type. It still answers `undefined` for an `ast`-only envelope instead of inventing text.
- `writeExpressionSource` declares the evaluated type it always returned: every value it produces carries a string `source`.

A blank `source` (`{ dialect: 'cel', source: '   ' }`) still type-checks. No type can refuse it, because the non-blank rule is a `.refine` on a string, so it is refused only at parse.

Priced as a patch, because no consumer can import these types. None of the three modules is reachable from the package's only type entry, `dist/index.d.ts`, and `exports` exposes nothing else. The emitted JavaScript of the three source files is identical apart from comments.
