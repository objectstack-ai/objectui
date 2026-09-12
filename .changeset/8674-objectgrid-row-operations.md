---
'@object-ui/plugin-grid': minor
'@object-ui/plugin-designer': patch
---

Per-row operation gating for `ObjectGrid`, and the Field Designer stops drawing a
delete action it refuses to run (objectui#8674).

**The defect.** `FieldDesigner`'s `handleDelete` returned early on `field.isSystem` —
before the confirm dialog — while the affordance was wired at the GRID level
(`onDelete={readOnly ? undefined : handleDelete}`). `ObjectGrid` takes one grid-level
`onDelete` and derives `{ update: !!onEdit, delete: !!onDelete }`, so the row action
was drawn for every row: clicking delete on a system field produced no dialog, no
toast and no console message. `readOnly` was honest in the same component (the
callback is withheld, so no button is drawn); `isSystem` drew the button and dropped
the click. The two states differed in the code and did not differ on screen.

**`@object-ui/plugin-grid` — new, additive, opt-in.** `ObjectGridComponentProps`
gains `rowOperations?: (record) => { update?: boolean; delete?: boolean }`, with the
new `ObjectGridRowOperations` type exported from the package root. It speaks the same
`update` / `delete` vocabulary the authored `operations` block speaks, resolved for
one row instead of for the grid, and it is an INTERSECTION like every layer around it
(the ADR-0103 lifecycle bucket, the object's `userActions`, the server's effective API
operations, the principal's own grant, the record-level explain verdict): `false`
withholds, and nothing it returns can re-open what those closed. A caller that passes
no predicate renders exactly what it rendered before — measured, not asserted: the
rendered DOM of a no-predicate grid is byte-identical across this change, and every
other `<ObjectGrid>` call site in the repository is such a caller.

It is a function value, so no metadata document can hold it and none is invited to:
like the nine `on*` callbacks it sits beside, it is a renderer prop and not an
authorable key.

**`@object-ui/plugin-designer` — the first caller, and the user-visible fix.** The
Field Designer passes the predicate, so a system field's row no longer offers Delete
at all. Edit is untouched: the drawer still opens for a system field, with `name` and
`type` disabled exactly as before — `isSystem` has never meant "this row is
untouchable". The guard inside `handleDelete` stays as a second line for direct
callers of the prop value, but it is no longer the only refusal.
