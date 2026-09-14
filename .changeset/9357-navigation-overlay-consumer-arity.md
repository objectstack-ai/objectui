---
'@object-ui/plugin-calendar': minor
'@object-ui/plugin-detail': minor
'@object-ui/plugin-gantt': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-kanban': minor
'@object-ui/plugin-list': minor
'@object-ui/plugin-map': minor
'@object-ui/plugin-timeline': minor
'@object-ui/plugin-tree': minor
---

The row/card click props on the view components now declare the modifier
payload they have always been invoked with (objectui#9357).

`useNavigationOverlay`'s `handleClick` invokes the handler it is given with two
arguments — the record, and an optional modifier payload (`metaKey` / `ctrlKey`
/ `button`) a host needs to implement Cmd/Ctrl/middle-click. objectui#9360 made
the hook's own option say so. These components pass a host-supplied prop
straight into that option, so the value a host writes against them is invoked
with two arguments too — and every one of these props declared only the record.
The payload was therefore invisible on the one line a host reads, exactly as it
had been on the hook.

Thirteen declarations across nine packages now name both parameters:

- `ObjectGridComponentProps.onRowClick`
- `ObjectKanbanComponentProps.onRowClick` (its sibling `onCardClick`, the other
  arm of the same fallback, already declared both)
- `KanbanRendererProps.schema.onCardClick`
- `ObjectCalendar`, `ObjectGantt`, `ObjectMap`, `ObjectTree`: `onRowClick`
- `ObjectTimeline`: `onRowClick` and `onItemClick`, the two arms of one fallback
- `ListView.onRowClick`
- `ObjectGallery`: `onRowClick` and `onCardClick`, likewise two arms of one
- `RelatedList.onRowClick`

**Source-compatible, and with no refused class.** A one-parameter handler is
still assignable to the widened signature, and a handler written against the
widened signature was already assignable to the narrow one — its minimum
argument count is still one. The second parameter is spelled `any` rather than
`HandleClickModifiers`, which is the difference that matters for callers: the
hook's own option names that interface and therefore refuses a handler whose
second parameter is annotated narrower (objectui#9360 documents that class and
the one-line remedy). These faces refuse nothing. A host that discovered the
payload from the implementation and annotated it `React.MouseEvent` — which is
what actually arrives — keeps compiling. `any` is also the spelling
`ObjectKanbanSchema.onCardClick` already carries for this same payload
(objectui#9341) and the one `BaseSchema`'s own `onClick` / `onChange` /
`onSubmit` use, and it is forced on the published twins in `@object-ui/types`,
which may not name a type that lives in a package depending on them.

**Runtime behaviour is unchanged.** Nothing is newly called and nothing newly
passes an argument; only the declarations move.

Three declarations that share the name and the shape are deliberately NOT
widened, because the value flowing through them is not invoked with the
payload: `VirtualGrid.onRowClick`, whose second parameter is a row index;
`ManageViewsDialog.onRowClick`, which receives a view id; and the `data-table`
family (`DataTableSchema.onRowClick`, `ObjectDataTableSchema.onRowClick`),
whose renderer invokes with one argument. Widening those would have declared a
payload that never arrives.
