---
'@object-ui/components': minor
'@object-ui/types': minor
---

**BREAKING (authoring surface and render behaviour, shipped as `minor` per this repo's
version policy): an item-level `body` on a `list` item or a `tabs` item is refused at the
door. Author `content`.** A stored `list` or `tabs` item carrying `body` now fails
`ListItemSchema` / `TabItemSchema` with a refusal that names `content` (objectui#9590).

Neither item face ever declared `body`, yet both renderers read it as a fallback: `tabs`
drew `body` through an `any` cast when `content` was missing, and `list` drew
`item.content || renderChildren(item.body)`. The zod faces STRIPPED the undeclared key, so
the one spelling that rendered was the one the validator dropped in silence. That is the
lenient-fallback shape AGENTS.md #0.1 bans, and objectui#6771 retired the same spelling at
node level.

## What changed

- **`list` renders `content`.** A string `content` is placed as-is, as before. A node or an
  array of nodes, the type `ListItem.content` declares, now renders through
  `SchemaRenderer`. Before this change it made the whole list fail to render ("Objects are
  not valid as a React child"), and an item-level `body` was the only way to put a node in
  a list item. The `body` read is gone, and the registration's `items` input names
  `content` only.
- **`tabs` renders `content`.** The `body` fallback is gone.
- **Both item faces refuse `body` by name.** `ListItem.body` and `TabItem.body` are `never`
  on the TypeScript face. `ListItemSchema.body` and `TabItemSchema.body` are alias
  refusals naming `content`, the same shape as `BaseSchema.body`, so `body` is refused at
  `items.N.body` instead of being stripped. Every other accepted key is unchanged.

## Migrating

Rename the key on the item. `{ "body": node }` on a `list` item becomes
`{ "content": node }`, and `{ "value": "a", "label": "A", "body": [...] }` on a `tabs`
item becomes `{ "value": "a", "label": "A", "content": [...] }`. Nothing in this
repository authors the old spelling any more: the `tabs` registration's own `defaultProps`
were respelled by objectui#9941, and the one teaching example, in the published
`objectui` skill's expressions guide, now uses `content`.
