---
'@object-ui/types': minor
---

fix(types): retire the eight `header-bar` keys the renderer never read (objectui#10387)

`HeaderBarSchema.title`, `logo`, `nav`, `left`, `center`, `right`, `sticky` and
`height` are retired on both faces (ADR-0049). None of them is in the spec, and
of the keys `HeaderBarSchema` declares for itself, the `header-bar` renderer reads
only `actions`, `crumbs`, `rightContent` and `search`. Rendered through the real
`SchemaRenderer`, a header with any of these keys was identical to one without
them.

- The zod mirror (`HeaderBarSchema` in `@object-ui/types/zod`) now refuses each
  key by name. The refusal says what the renderer reads instead.
- The TypeScript declaration types each key `never`.
- `logo` also stops disagreeing with itself: the declaration said an image URL
  string and the mirror a node or node list. Neither rendered, and both are
  refused now.

Breaking, but only for documents the renderer already ignored. A `header-bar`
that carries any of the eight keys now fails validation and no longer
type-checks. To migrate, delete the key:

- `title`: name the current page with the last entry of `crumbs`.
- `logo`: put brand content in `rightContent` or `actions`.
- `nav`: put links in `crumbs`, or use a `navigation-menu` / `sidebar` node.
- `left` / `center`: put custom content in `rightContent` or `actions`.
- `right`: use `actions` (a node list) or `rightContent` (one node).
- `sticky`: make the parent layout sticky; the header itself never was.
- `height`: remove it, and set the height with `className` instead (for example
  `h-20 sm:h-20`). By default the header is `h-14`, and `sm:h-16` from the `sm`
  breakpoint up.

The in-tree examples that used these keys (`packages/types/examples/dashboard.ts`,
the `@object-ui/types` README and the ObjectOS integration guide) now use
`crumbs` and `actions`.
