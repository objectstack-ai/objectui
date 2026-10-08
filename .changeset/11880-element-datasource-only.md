---
'@object-ui/components': patch
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

`element:record_picker` and `element:number` bind data through the node-level `dataSource` only (objectui#11880, part of the objectui half of objectstack#11509, ruled A-narrow).

- Neither element reads the flat `properties.object` / `filter` / `sort` / `limit` beside the binding any more: the `composed?.x ?? props.x` fallbacks are gone, and `element:number`'s filter is the binding's alone (the AND with `properties.filter` is gone). An element whose node names no `dataSource.object` issues no query. The flat keys stay published until `@objectstack/spec` retires them in v18; each input's description now says it is not read and names the binding member that is.
- The Studio page designer writes `element:number`'s object to `dataSource.object` at node level, and its measure picker reads the object from there. A stored `properties.object` stays visible in the inspector's Advanced section.
- `element.number.noObject` now names only `dataSource.object`, in all ten language packs.

Breaking for an author who wrote the flat keys on these two elements: move them into `dataSource`. `element:repeater` is unchanged.
