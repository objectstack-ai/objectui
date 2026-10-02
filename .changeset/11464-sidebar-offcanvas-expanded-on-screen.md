---
'@object-ui/components': patch
---

fix(components): an expanded `offcanvas` sidebar is drawn inside the viewport (objectui#11464)

The Shadcn `Sidebar` in its `offcanvas` form, the default, drew its EXPANDED panel one sidebar-width past the edge it is anchored to, so the panel was off screen. It also reserved no width beside the page, and its rail took the collapsed styling. Collapsing and expanding it changed nothing a user could see.

Upstream Shadcn blanks `data-collapsible` while the sidebar is expanded, so its offcanvas rules can only match a collapsed sidebar. This package keeps the attribute in every state, for styling and test locators, and had qualified only the `icon` rules by the collapsed state. The offcanvas rules (the gap, the panel's left and right offsets, and the rail) now carry the same qualifier. They are declared as a local patch family in `scripts/shadcn-local-patches.mjs`, so a sync re-applies them.

Who sees the change:

- The `sidebar` node with `collapsible` omitted or `true`, which keeps the `offcanvas` form. In a host with no provider it mounts its own, open by default, so it now draws on screen at the start of the page instead of off it.
- `@object-ui/layout`'s `SidebarNav` with `collapsible="offcanvas"`, and any direct use of `Sidebar` in that form.

Unchanged: a collapsed `offcanvas` sidebar still sits wholly outside the viewport; the `icon` form, which the console's own sidebar uses, draws as before; `collapsible: false` (`none`) is drawn in the page flow as before; below the `md` breakpoint the sidebar is still the mobile sheet.
