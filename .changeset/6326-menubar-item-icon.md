---
'@object-ui/components': patch
---

`ui:menubar` now draws an item's authored `icon`, and walks submenus to any depth
(objectui#6326).

`MenubarMenu.items` is typed `MenuItem[]` — the same type `ui:dropdown-menu` and
`ui:context-menu` read — and `MenuItem` declares `icon?: string`, which the component
docs list too. The menubar renderer never referenced the key, so an author following
the documented shape got no glyph and no error. The name is now resolved through the
same lucide `icons` record the two sibling menus use (objectui#5930, objectui#6278), on
every arm that draws an item: a top-level item, a submenu trigger, and an item inside a
submenu. An unknown or retired spelling (such as `edit`) draws no glyph, never a
fallback glyph.

`MenuItem.children` is recursive by type and documented as "drawn as a nested submenu",
but the renderer walked exactly one level: a submenu child carrying its own `children`
was drawn as a plain item and those children were unreachable. It now renders a nested
submenu at every depth.
