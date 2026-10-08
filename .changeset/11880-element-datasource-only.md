---
'@object-ui/components': patch
'@object-ui/app-shell': patch
---

Page elements bind data through the node-level `dataSource` only (objectui#11880, the objectui half of objectstack#11509, ruled A-narrow).

- `element:repeater` reads its query from the `dataSource` binding: `object`, `filter`, `sort` and `limit`, composed with the saved view its `view` names. A repeater bound only through `dataSource` used to render "No records". An unresolvable `view` now shows the configuration-error panel, and a resolving one the loading panel. Its registration declares the binding through the injected `dataSource` input and no longer publishes `object`, `filter`, `sort` or `limit`.
- `element:record_picker` and `element:number` no longer read the flat `properties.object` / `filter` / `sort` / `limit` beside the binding, and no longer publish them as inputs. `element:number`'s filter is the binding's alone: the AND with `properties.filter` is gone. An element whose node names no `dataSource.object` issues no query.
- The Studio page designer writes `dataSource.object` for `element:repeater` and `element:number`, and `dataSource.limit` for the repeater's row cap, at node level. Their field pickers read the object from `dataSource.object`. A stored `properties.object` stays visible in the inspector's Advanced section.

Breaking for an author who wrote the flat keys on these three elements: move them into `dataSource`. `@objectstack/spec` retires the flat keys in v18.
