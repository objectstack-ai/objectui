---
'@object-ui/plugin-detail': minor
---

refactor(plugin-detail)!: retire the `related-list` node type key; the related-list block is `record:related_list` (objectui#10859, batch 8 phase 2b)

**BREAKING (authoring):** the plugin no longer registers `related-list` (and with it `plugin-detail:related-list`). `objectui validate` refused a `related-list` node at `type`, nothing in this repository, its examples or objectstack authored it, and its declared `type` input collided with the node discriminator. A node authored `type: "related-list"` now renders the "Unknown component type" panel. `RelatedList` stays a named export.

Migration:

- `{ "type": "related-list", … }` → `{ "type": "record:related_list", "properties": { … } }`, the armed block this plugin registers, or mount `RelatedList` directly.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
