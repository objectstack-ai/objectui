---
'@object-ui/plugin-grid': minor
---

refactor(plugin-grid)!: retire the `import-wizard` node type key; the `ImportWizard` export stays (objectui#10859, batch 8 phase 2b)

**BREAKING (authoring):** the plugin no longer registers `import-wizard` (and with it `plugin-grid:import-wizard`). `objectui validate` refused an `import-wizard` node at `type`, and nothing in this repository, its examples or objectstack authored it. A node authored `type: "import-wizard"` now renders the "Unknown component type" panel. `ImportWizard` stays a named export, and `@object-ui/app-shell` already mounts it directly.

Migration:

- `{ "type": "import-wizard", "objectName": …, "fields": … }` → mount `ImportWizard` directly, passing `objectName`, `fields` and the `dataSource`.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
