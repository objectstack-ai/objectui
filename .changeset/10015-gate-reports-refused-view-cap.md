---
'@object-ui/react': patch
---

`ElementDataSourceGate` now reports a saved view's refused row cap on the renderer path
(objectui#10015).

objectui#9928 made `@object-ui/core` drop a saved view's `pagination.pageSize` (or legacy flat
`limit`) when the contract refuses it: `0`, a negative, or a fraction. The drop is correct, but on
the renderer path it removed the author's only diagnostic. The node's cap went from `0` to absent,
and the consuming renderer treats an absent key as "not a mistake". The gate had never reported a
VIEW cap, so nothing reported it at all.

The gate now emits `elementDataSourceRefusedLimitMessage`, the same sentence `ViewDataProvider`
already uses on the path with no renderer. It is emitted once per declaration, from an effect and
never from render, on the same `console.warn` channel. It fires only when the refusal changed what
the block receives: the block reads a row cap, the binding declares no `limit` of its own, and the
component's own cap is not a usable one. A view with no cap, a usable view cap, a usable component
cap, a binding `limit`, or a block with no row cap stays silent. It never fires together with the
gate's existing displaced-cap message (objectui#9899), because that message needs a usable cap to
have been written and, with the view's cap refused, the only one left is a binding `limit`. No
wire value changes.
