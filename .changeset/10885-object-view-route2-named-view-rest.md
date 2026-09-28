---
'@object-ui/plugin-view': patch
---

A named view's `navigation`, `fieldOrder` and `inlineEdit` now reach the registered `object-view` renderer's grid (objectui#10885, member 4).

`object-view` is registered without a `renderListView`, so an authored node, and the Studio's view preview, draws a grid named view as the `object-grid` node `ObjectView` builds for `ObjectGrid`. That path now reads three more members off the active named view:

- `navigation` replaces the node's `navigation` as a whole while the named view is active. Everything `ObjectView` derives from it follows: the row click, the surface the record, create and edit forms open on, and that surface's width. Under a named `split` or `popover`, as under the node's own, the New button opens no form, because those two surfaces open only beside a selected record. The host `renderListView` delegation's row click follows it too: both paths hand down the same click handler, and until now that handler read the node's `navigation` only, so a named view's `navigation` was overruled there as well. A host `onRowClick` passed to `ObjectView` still wins on both paths.
- `fieldOrder` orders the projected columns, after `hiddenFields` has removed its fields, the same way `ListView` orders them on the delegation. Columns `fieldOrder` does not name keep their order after the named ones. A name the projection does not carry orders nothing, and with no projection nothing is added.
- `inlineEdit` is handed to the grid as `editable`. `ObjectGrid` still turns in-cell editing on only where the object grants inline edit and the user may update the record.

`label` and `data`, also declared on both a named view and `object-grid`, are not handed to the grid on this path, by ruling. The named view's `label` is already the tab's text, and handing it to the grid would paint a second caption the delegation never paints. `data` is held back because `ListView` and `ObjectGrid` pick different objects when `data.object` differs from the node's `objectName` (objectui#10971).

What moves: only a named view that authors one of these three members. The objectui#5097 host-composition relay is unchanged.

`Clause-②: no` — no declared type, accepted key or published export moves. A renderer starts honouring members the spec already declares on a named view.
