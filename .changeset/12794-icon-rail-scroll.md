---
'@object-ui/app-shell': patch
---

In the collapsed (icon-mode) console sidebar, the rail now scrolls vertically when its rows overflow, as the expanded sidebar does. Before, the rows below the fold could not be reached until the sidebar was expanded again (objectui#12794).

The `SidebarContent` primitive clips its content in icon mode with `overflow-hidden`. `UnifiedSidebar` now passes the same icon-mode variant with `overflow-auto` and `overflow-x-hidden`, so the rail scrolls up and down but never sideways. It draws no scrollbar, because a scrollbar would take its width out of the 3rem rail and push the icons off-centre. The mouse wheel, touch and keyboard focus still scroll it. The rail's width and the icons' centring are unchanged.

Off icon mode nothing changes: the expanded sidebar and the mobile sheet scroll as before, with the host's scrollbar. The primitive itself is a Shadcn-synced file and is not edited, and no export, prop or type member is added.
