---
'@object-ui/components': patch
---

`ui:header-bar` now applies an authored `className` to its root `header` element
(objectui#10397).

`HeaderBarSchema` extends `BaseSchema`, whose `className` is the declared Tailwind
override channel, but the renderer's root carried a fixed class string. Rendered
through the real `SchemaRenderer`, a header with `className` was byte-identical to
one without it.

The root now merges `className` after its own classes through `cn()`
(tailwind-merge), so an authored utility that conflicts with a default replaces it:
`h-20` replaces `h-14`. The merge is per variant, so `h-20` leaves `sm:h-16` in
place; write `h-20 sm:h-20` for one height at every width. Without `className` the
root's classes are unchanged.

The scope class `SchemaRenderer` appends to a node's `className` for its
`responsiveStyles` rides the same channel, so a header's `responsiveStyles` now
reach its root too. Before, that class never arrived and the compiled rules matched
nothing.

The docs page now lists `search`, `actions` and `rightContent` in its Schema block,
and gives the height as the code sets it: `h-14`, and `sm:h-16` from the `sm`
breakpoint up.

Scored `patch`: a declared key that had no effect on this node now applies.
