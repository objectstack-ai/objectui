---
'@object-ui/components': minor
---

refactor(components)!: retire the ten `sidebar-*` node type keys; the `sidebar` node supplies its own provider (objectui#10859, batch 8 phase 2d)

**BREAKING (authoring):** `@object-ui/components` no longer registers `sidebar-provider`, `sidebar-header`, `sidebar-content`, `sidebar-group`, `sidebar-menu`, `sidebar-menu-item`, `sidebar-menu-button`, `sidebar-footer`, `sidebar-inset` or `sidebar-trigger`, nor their `ui:` twins. `objectui validate` already refused each of them at `type`. Nothing in this repository or in objectstack authored or emitted them except the four `components-basic-sidebar` catalog documents, which now author the `sidebar` node. A node of one of these types now renders the "Unknown component type" panel. The shadcn components behind them (`SidebarProvider`, `SidebarHeader`, `SidebarMenuButton`, `SidebarTrigger` and the rest) stay exported for JSX composition.

Migration, measured against `objectui validate`. The `sidebar` node is the one sidebar region; it renders its `children` in order and passes `className` to the sidebar element:

- `sidebar-provider` → drop it. The `sidebar` node uses the provider its host already mounts, such as the app shell's, and mounts its own when the host has none. A `sidebar-provider` wrapping a `sidebar` becomes that `sidebar` node alone;
- `sidebar-header`, `sidebar-content`, `sidebar-footer`, `sidebar-group`, `sidebar-menu` and `sidebar-menu-item` → drop the wrapper and move its `children` up into the `sidebar` node's `children`. Group headings are `text` nodes, and a `separator` node divides groups;
- `sidebar-group`'s `label` → a `text` node with that `content`, placed before the group's items;
- `sidebar-menu-button` → a `button` node with `label` and `variant: "ghost"`, or a `flex` row (`properties.children`) holding a `text` node and a `badge` node for an item with a count;
- `sidebar-inset` → no node spelling. Place the main content beside the `sidebar` node in your page layout, or compose `SidebarInset` in JSX;
- `sidebar-trigger` → no node spelling. A host that mounts the provider renders `SidebarTrigger` itself, as the app shell does.

**Clause-②: yes** — ten registrations leave the runtime (narrowing), released as `minor` with this banner.
