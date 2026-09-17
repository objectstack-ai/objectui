---
'@object-ui/types': minor
---

Export `ObjectTreeSchema` from the `@object-ui/types` root barrel (objectui#9550)

`ObjectQLComponentSchema` declares the node types an ObjectQL block may be.
Every one of its arms was a named export of this package's root barrel except
`ObjectTreeSchema`, which was declared in `objectql.ts`, applied by the union,
and re-exported by the `./zod` barrel (objectui#7917) — while no TypeScript
consumer could name it. There is no `./objectql` subpath to reach around the
barrel: the package's `exports` map is pinned by
`packages/types/src/__tests__/package-exports-manifest.test.ts`, and the root
barrel was the only route to this type.

The omission was not inert. The seat that stopped `ObjectTreeProps.schema`
being `any` in `@object-ui/plugin-tree` (objectui#8655) could not import the
name, so it had to spell the node as
`Extract< ObjectQLComponentSchema, { type: 'object-tree' } >` — an idiom that
worked, and that every reader of that file had to decode. A type nobody
can import mints a fresh hand-written copy of itself for each consumer that
needs it, which is the second-authority shape objectui#6349 is burning down.

The change is one name added to an existing explicit named re-export list.
Nothing is removed, retyped or narrowed: `Extract` off the union still
resolves, and `packages/types/src/__tests__/object-tree-root-barrel-9550.test.ts`
pins that the imported name and that `Extract` are the same declaration, that
the list stays explicit rather than becoming a wildcard, and that the
declaration itself stays in `objectql.ts`.

The one hand-written copy this gap had already minted is retired in the same change: `@object-ui/plugin-tree` now imports the name instead of re-deriving it. See that package's own entry.

⛔ Not done here: a gate over barrel completeness for every declared node
schema. That was the card's own third option and it is a wider design with its
own review; objectui#9526 is the sibling card in the same family.
