---
'@object-ui/layout': patch
'@object-ui/app-shell': patch
---

In the collapsed (icon-mode) sidebar, a click on an icon reaches its row again. Before, a hidden group label could take the click instead (objectui#12744).

The `SidebarGroupLabel` primitive hides a label in icon mode with `opacity-0` and `-mt-8` only. The invisible label stayed hit-testable and lay over the lower half of the row just above its group. A centre click on that row's icon landed on the label. A collapsible group's label toggled its group, the Recent label toggled Recent, and the row did not navigate.

The labels that sit below a row now take no pointer events while the primitive hides them. The condition is the primitive's own `group-data-[state=collapsed]:group-data-[collapsible=icon]:` variant:

- `@object-ui/layout`: `NavigationRenderer`'s collapsible group label, and its Favorites label (it sits below the Area switcher in a multi-area app);
- `@object-ui/app-shell`: `UnifiedSidebar`'s Recent label.

In the expanded sidebar nothing changes. A group's label still toggles its group by mouse and keyboard, and the Recent label still opens and closes Recent. The primitive itself is a Shadcn-synced file and is not edited: the class rides on the `className` each call site passes. Nothing is added to either package entry: no export, prop or type member.
