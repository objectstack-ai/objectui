---
'@object-ui/layout': patch
---

In the collapsed (icon-mode) sidebar, a hidden group label is no longer a keyboard focus stop, and screen readers no longer announce it (objectui#12795). Before, Tab from the row above a collapsible group landed on the group's invisible label button, and Enter toggled a group the user could not see.

The `SidebarGroupLabel` primitive hides a label there by fading it to `opacity-0`, which left it in the tab order and the accessibility tree. `NavigationRenderer`'s collapsible group and Favorites labels, `AppSchemaRenderer`'s Area label and `SidebarNav`'s group labels now also take `visibility: hidden` under the primitive's own icon-mode condition. The label still fades out before it is hidden. Tab now moves from a group's last row straight to the next group's first row.

In the expanded sidebar and the mobile sheet nothing changes: every group label that took focus still does, and Enter still opens and closes its group. The primitive itself is a Shadcn-synced file and is not edited, and no export, prop or type member is added.
