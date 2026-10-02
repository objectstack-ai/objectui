---
'@object-ui/plugin-tree': minor
---

refactor(plugin-tree)!: retire the bare `tree` node type key; `object-tree` is the one spelling (objectui#10859, batch 8)

**BREAKING (authoring):** the plugin no longer registers `tree` (and with it `view:tree`), the second key it registered on the `object-tree` renderer with the same inputs. `objectui validate` refused a `tree` node at `type`, because only `object-tree` has a declaration (`@objectstack/spec`'s `ComponentPropsMap` row), and nothing in this repository authored the alias. A node authored `type: "tree"` now renders the "Unknown component type" panel.

Migration:

- `{ "type": "tree", … }` → `{ "type": "object-tree", … }`, with the same keys.

The host-composition VIEW type `tree` and the FIELD type `tree` are different layers and are unchanged: `ObjectView` and `ListView` already compose a stored tree view into an `object-tree` node.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
