---
'@object-ui/plugin-designer': patch
---

The dashboard editor reads a `widgets[]` entry by the slot's element type, `DashboardComponentSchema['widgets'][number]`, in its widget card, its property panel, its preview and its measure probe (objectui#11514). `@object-ui/types` no longer lets the slot's component arm stand in for `DashboardWidgetSchema`, and these reads annotated entries with that interface. Type-only: nothing the editor renders, offers or writes changes.
