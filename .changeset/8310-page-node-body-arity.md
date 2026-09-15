---
'@object-ui/types': minor
---

Widen `PageNodeSchema.body` to `SchemaNode | SchemaNode[]` on both faces, and drop the
reader's cast (objectui#8310, maintainer ruling 2026-09-07, director decision batch #2).

`BaseSchema.body` has always been `SchemaNode | SchemaNode[]`. `PageNodeSchema` inherited
that channel and narrowed it to `SchemaNode[]` — on the TypeScript face and in the zod
mirror alike — while the only reader of the channel went on accepting a bare node.
`FlatContent`, the legacy body/children fallback inside `PageRenderer`, normalizes a single
node into a one-element list and needed a `content as SchemaNode` cast to say so, because
its own declared input forbade the value it handles. That cast is now deleted: the
declaration admits what the reader always accepted.

**Purely additive.** Every `body` that was legal before is legal now; the union only adds
the single-node arity. Nothing has to change in authored metadata, and no runtime behaviour
moves — `FlatContent` drew both arities before this change and draws both after it.

**Why widen rather than narrow.** The single-node form is what this project's own landing
page teaches: the root `README.md` "Basic Usage" example gives `body` one `grid` node. It
type-checked only because `SchemaRendererProps.schema` is annotated `BaseSchema`, the wider
parent — so an author who reached for the *precise* type (the shape a contract-first host
wants, and the type `PageRenderer`'s own props already use) was refused for a value the
renderer draws, while an author who did not got no arity check at all. The narrowing was
also the outlier inside its own file: `CardSchema.body` and `AspectRatioSchema.body` already
spell the union. Narrowing the runtime instead — and migrating stored pages — was weighed
and refused, as was a staged retirement of the single-node form.

**Bounded, and the bound is measured.** `BaseSchema` carries `[key: string]: any`, so
annotating an authored page catches a value of the wrong TYPE (TS2322) and never a
misspelled KEY (absorbed by the index signature, zero diagnostics). This change repairs the
arity of one declared key. It does not make the page node a closed surface.

Which channel `PageRenderer` reads — `body` or `children` — is a separate question and is
not touched here (objectui#8284 remains open).
