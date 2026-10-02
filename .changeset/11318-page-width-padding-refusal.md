---
'@object-ui/types': minor
---

A `page` node refuses `maxWidth` and `padding` by name, and the layout guide teaches the
controls that work: `pageType` for the page's width, a `container` for a narrower column or
custom padding (objectui#11318).

**Breaking for a `page` node that carries `maxWidth` or `padding`.** Both keys are `container`
members. The page node never declared them, and `PageRenderer` never read them: it takes its
max-width class from `pageType`, and its wrapper padding is fixed. `BaseSchema`'s
`.passthrough()` kept the keys anyway, so a page carrying `maxWidth: 'lg'` or `padding: false`
parsed clean and rendered exactly as it would without them. The layout guide taught both, in
four snippets.

- `@object-ui/types`: `PageNodeSchema.maxWidth` and `PageNodeSchema.padding` are now `never` on
  the TypeScript face, and the zod mirror refuses each key by name, at its own path
  (`invalid_type`), with a message that names the door that works. For `maxWidth` that is
  `pageType`, or a `container` in `children` with its own `maxWidth`. For `padding` it is a
  `container` in `children` with its own `padding`. `safeValidateSchema` (what
  `objectui validate` runs) gives the same refusal. So does the strict authoring face, which
  refused both keys before only as an unnamed `unrecognized_keys`.
- Unchanged: `ContainerSchema.maxWidth` and `ContainerSchema.padding`, and every other key of
  the page node, which stays open to unknown renderer props.

Migration: delete the key from the page node. To narrow the page, set `pageType` (`utility` is
the narrowest). To get a narrower column or your own padding, wrap the content in
`{ "type": "container", "maxWidth": "2xl", "padding": 8, "children": [ … ] }`.
