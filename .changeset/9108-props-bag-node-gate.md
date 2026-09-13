---
'@object-ui/react': minor
---

`SchemaRenderer`'s node gates now read the legacy `props` config bag as a last
resort, so a visibility or enablement predicate authored under that spelling is
finally honoured (objectui#9108).

**What was wrong.** A node may spell its config bag `properties` (the spec
spelling) or `props` (the annotated legacy alias). The hoist in the evaluation
memo copies `properties.*` onto the node; nothing copies `props.*`. Both node
gates read the post-hoist node, so a predicate that arrived under the alias was
never one of the keys either gate could see. Measured at node level, four rows:
`props: { visible: false }` rendered and `props: { hidden: true }` rendered,
while `properties: { visible: false }` and `properties: { hidden: true }` each
hid correctly. Fail-**open** and silent by construction — a gate that never bit
renders exactly like a gate that said yes — so it could not be found by looking
at a page, only by counting.

**BREAKING (scored `minor` per this repo's version-alignment convention)** — deliberately,
and narrowly. A node whose author wrote a falsy
visibility predicate (or a truthy `disabled`) inside a `props` bag rendered
before and is now gated. That is the whole point of the repair, and it is the
only verdict that moves: the alias is consulted **only** where the post-hoist
node holds nothing, so a key the node itself declares — or one the canonical
bag hoisted onto it — still decides exactly as before. Marked `minor` rather
than `patch` for that reason.

**Precedence is unchanged in both directions.** `properties` still wins on both
channels (objectui#5123, maintainer ruling 2026-08-18); the subtraction that
enforces it keeps its single declaration and is reused here rather than
restated. Nothing is hoisted: `props` is still not copied onto the node,
`schema.<KEY>` is still undefined for a renderer declared as `({ schema })`,
and the dropped-props-bag dev warning still says exactly what it said.

**Migration.** A producer census over every tracked document in this repository
found **zero** authoring a predicate key inside a `props` bag, so nothing here
changes. If your own metadata authors one, it was silently doing nothing before
and now takes effect: check that the predicate says what you meant, or move the
key to `properties`, which is the spec spelling and has always worked.
