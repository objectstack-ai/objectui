---
'@object-ui/components': minor
---

**BREAKING (render behaviour, shipped as `minor` per this repo's version policy):** a
`tabs` item draws its panel from `content` and nothing else. The renderer no longer
falls back to an item-level `body` (objectui#9590).

`TabItem` declares no `body` on either published face. The TypeScript interface has no
such member, and `TabItemSchema` declares `content` required and strips an undeclared
`body`. The renderer still drew `body` through an `any` cast whenever `content` was
missing, which honoured a key the contract refuses: the lenient-fallback shape
AGENTS.md #0.1 bans. An item authored as `{ "value", "label", "body": [...] }` is
refused by `TabItemSchema` (`content` is required); it now also renders an empty panel
instead of the `body` nodes.

## Migrating

Rename the key on the item: `{ "value": "a", "label": "A", "body": [...] }` becomes
`{ "value": "a", "label": "A", "content": [...] }`. Nothing in this repository authors
the old spelling. The registration's own `defaultProps` items were respelled to
`content` by objectui#9941, and `pnpm census:body-dialect-producers` re-derives that
reading.

⛔ Not changed here: at this change, `list` still reads an item-level `body`. Its
retirement also rewrites published teaching that this change does not touch, and it is
tracked on objectui#9590.
