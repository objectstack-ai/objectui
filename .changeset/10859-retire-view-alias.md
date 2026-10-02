---
'@object-ui/plugin-view': minor
---

refactor(plugin-view)!: retire the bare `view` node type key; `object-view` is the one spelling (objectui#10859, batch 8)

**BREAKING (authoring):** the plugin no longer registers `view` (and with it `plugin-view:view`), an alias of the `object-view` renderer that declared no inputs. `objectui validate` refused a `view` node at `type` while it accepts `object-view`, and nothing in this repository authored the alias. A node authored `type: "view"` now renders the "Unknown component type" panel. The README's and the plugin page's registration tables lost the row.

Migration:

- `{ "type": "view", … }` → `{ "type": "object-view", … }`, with the same keys.

The `view` METADATA namespace (saved views, `client.meta.getItems('view')`) is a different layer and is unchanged.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
