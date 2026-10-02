---
'@object-ui/plugin-designer': minor
---

refactor(plugin-designer)!: retire four builder-chrome node type keys (objectui#10859, batch 8 phase 2b)

**BREAKING (authoring):** the plugin no longer registers `app-creation-wizard`, `navigation-designer`, `dashboard-editor` or `branding-editor` (and with them their `plugin-designer:` keys). `objectui validate` refused each at `type`, and none appears as a node type anywhere in this repository, its examples or objectstack. A node authored with one of these types now renders the "Unknown component type" panel. `AppCreationWizard`, `NavigationDesigner`, `DashboardEditor` and `BrandingEditor` stay named exports.

Migration:

- `{ "type": "app-creation-wizard", … }` → mount `AppCreationWizard` directly;
- `{ "type": "navigation-designer", … }` → mount `NavigationDesigner` directly;
- `{ "type": "dashboard-editor", … }` → mount `DashboardEditor` directly;
- `{ "type": "branding-editor", … }` → mount `BrandingEditor` directly.

**Clause-②: yes** — registrations leave the runtime (narrowing), released as `minor` with this banner.
