---
'@object-ui/types': minor
---

fix(types): retire the four `header-bar` keys nothing reads or authors (objectui#10387)

`HeaderBarSchema.nav`, `left`, `center` and `height` are retired on both faces
(ADR-0049). None of them is in the spec, and the `header-bar` renderer reads only
`actions`, `crumbs`, `rightContent` and `search`. Rendered through the real
`SchemaRenderer`, a header with any of these keys was identical to one without
them. No in-tree app, example or doc authored any of the four.

- The zod mirror (`HeaderBarSchema` in `@object-ui/types/zod`) now refuses each
  key by name. The refusal says what the renderer reads instead.
- The TypeScript declaration types each key `never`.

Breaking, but only for documents the renderer already ignored. A `header-bar`
that carries `nav`, `left`, `center` or `height` now fails validation and no
longer type-checks. To migrate, delete the key:

- `nav`: put links in `crumbs`, or use a `navigation-menu` / `sidebar` node.
- `left` / `center`: put custom content in `rightContent` or `actions`.
- `height`: remove it. The header's height is fixed by the renderer.

`title`, `logo`, `right` and `sticky` are also unread, but in-tree documents
author them. They are unchanged here.
