---
---

Types only, no package released. `@object-ui/react`'s `SchemaRenderer` types its working copy of a node
as internal renderer state instead of through `BaseSchema`'s `[key: string]: any` (objectui#11349). The
copy is the shallow `{ ...schema }` its evaluation memo rewrites and renders from. The working type is not
exported, and no published declaration names it: the package's built `.d.ts` files are byte-identical, and
the pull request records the comparison. Every read that used to be `any` now reads `unknown` and narrows
first, through the guard it already had. Runtime behaviour does not move. The working type names two
authored keys on rulings. `props` is the annotated legacy alias of `properties` (objectui#5123), and
`visibility` is the spec's deprecated alias, by reference. The interpreter's `_hidden` / `_disabled`
markers are declared as the renderer state they are. With objectui#8347's index-signature removal applied
locally, the package's two type-check programs read zero errors.
