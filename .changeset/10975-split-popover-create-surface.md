---
'@object-ui/plugin-view': patch
---

Under a `split` or `popover` navigation, `ObjectView`'s New button now opens a create form (objectui#10975).

Both surfaces draw a form only beside a selected record, and New clears the selected record, so until now the button did nothing under either mode. That held for the node's own `navigation` and, since objectui#10885, for the active named view's. The create form now opens on the surface the node uses with no `navigation`: the modal for `layout: 'modal'`, the drawer otherwise. A `layout: 'page'` node with an `onNavigate` handler still hands New to the router, as before. A record opened to view or edit still opens beside the list under `split`, and in the popover under `popover`.

`Clause-②: no` — no declared type, accepted key or published export moves.
