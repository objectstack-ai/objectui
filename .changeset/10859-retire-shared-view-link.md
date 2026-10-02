---
'@object-ui/plugin-view': minor
---

refactor(plugin-view)!: retire the `shared-view-link` node type key (objectui#10859, batch 8 phase 2b)

**BREAKING (authoring):** the plugin no longer registers `shared-view-link` (and with it `view:shared-view-link`). `objectui validate` refused a `shared-view-link` node at `type`, and nothing in this repository, its examples or objectstack authored it. A node authored `type: "shared-view-link"` now renders the "Unknown component type" panel. `SharedViewLink` stays a named export.

Migration:

- `{ "type": "shared-view-link", "objectName": …, "viewId": … }` → mount `SharedViewLink` directly with the same props.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
