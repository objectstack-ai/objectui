---
'@object-ui/app-shell': patch
---

The page designer no longer carries a curated property panel for the `ai:input`
block (objectui#8280). The palette has never offered `ai:input`, and it is not a
`PageComponentType` in `@objectstack/spec`, so no author could drag one in; the
panel's two controls (`agentName`, `placeholder`) and their three English and
three Chinese labels had outlived their block. `ai:chat_window` was handled the
same way in objectui#2943. Nothing an author can reach from the palette changes.
A page that already has an `ai:input` node shows that node's keys in the
inspector's generic "Advanced" section, as it does for any block without a panel.

No renderer or palette entry is added for `ai:input`. The placeholder that
`@object-ui/components` registers for it is unchanged.

The designer test that checks "a block with a config panel is a block the palette
offers" now reads the palette itself. It used to check only block types that the
spec declares, so a non-spec name with a panel and no palette entry passed
without being checked. That is how `ai:input` got past it.
