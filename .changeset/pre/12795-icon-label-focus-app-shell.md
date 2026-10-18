---
'@object-ui/app-shell': patch
---

In the collapsed (icon-mode) console sidebar, the hidden Area, Recent and Starred group labels are no longer announced by screen readers (objectui#12795). The `SidebarGroupLabel` primitive hides a label there by fading it to `opacity-0`, which left it in the accessibility tree; the labels now also take `visibility: hidden` under the primitive's own icon-mode condition, and still fade out before they are hidden. Together with the `@object-ui/layout` change, Tab in the icon rail now moves from a group's last row straight to the next group's first row instead of stopping on an invisible label.

In the expanded sidebar and the mobile sheet nothing changes: the Recent label still opens and closes Recent. No export, prop or type member is added.
