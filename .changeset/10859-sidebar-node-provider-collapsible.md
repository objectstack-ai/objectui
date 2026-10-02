---
'@object-ui/components': minor
---

feat(components): the `sidebar` node mounts a `SidebarProvider` only when none is above it, and honours the boolean `collapsible` (objectui#10859, batch 8 phase 2d)

- **Provider.** shadcn's `Sidebar` throws outside a `SidebarProvider`, so a `sidebar` node used to render the error panel in any host that did not mount one. Now the node reads the provider context without throwing. In a host that already mounts a provider (the app shell, through `@object-ui/layout`'s `AppShell`), the node uses that one: the tree keeps exactly one provider, and the host's open state drives the node. In a host without one, the node mounts its own around itself.
- **`collapsible`.** The spec types `SidebarSchema.collapsible` as a boolean, but the node forwarded it into shadcn's `'offcanvas' | 'icon' | 'none'` prop, so `true` and `false` reached the DOM as `data-collapsible="true"` / `"false"`, which no rule matches. Now `false` draws shadcn's in-flow, fixed-width form, which ignores the open state. `true`, or leaving the key out, keeps the default the node applied before (`offcanvas`). Any other value is forwarded unchanged, as before; `objectui validate` refuses it at `collapsible`. The registration's `collapsible` input is now declared as a boolean, and its `defaultProps` no longer name `collapsible`: that `'icon'` was never read at render.
- **`useOptionalSidebar()`.** A new export next to `useSidebar()`, added to the Shadcn primitive as a declared local patch (`scripts/shadcn-local-patches.mjs`). It returns the sidebar context, or `null` where `useSidebar()` would throw.
