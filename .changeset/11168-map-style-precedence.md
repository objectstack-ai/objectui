---
'@object-ui/plugin-map': patch
---

`object-map` reads `mapStyle` before `map.style`, as `@objectstack/spec`'s `object-map` row says in `mapStyle`'s own description ("Read before `map.style`"). This is objectui#11168 slice 3, under the seat's ruling: the renderer follows the spec.

**Behaviour change.** A map that writes both a node-level `mapStyle` and a `style` inside its `map` block now draws `mapStyle`. Until now, the block's `style` won on that path. A map writing only one of the two, or neither, draws exactly what it drew before. The map path with no `map` block already read `mapStyle` first.

No authored producer in objectui or objectstack writes both. The only producers of `mapStyle` are the `ListView` / `ObjectView` flatteners, and they write it on the path with no `map` block. So no stored document changes what it draws. The `object-map` registration publishes the spec's description for `mapStyle` verbatim.
