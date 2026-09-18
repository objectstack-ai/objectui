---
'@object-ui/components': minor
'@object-ui/plugin-view': minor
'@object-ui/types': minor
---

Forward the row-click modifier payload through the three hops that were dropping it
(objectui#9462), so Cmd/Ctrl/middle-click on a row reaches a host handler.

`useNavigationOverlay`'s `handleClick` has always invoked the handler it is given with
two arguments — the record, and the modifier payload (`metaKey` / `ctrlKey` / `button`)
a host needs to answer "open this record in a new tab". objectui#9360 made the hook's
option declare that payload and objectui#9460 made the component props on the path
declare it. Three hops in the middle received it and passed one argument on, so a host
wiring a modifier-click handler to `ObjectGrid`, `ListView` or `plugin-view`'s
`ObjectView` always read `undefined` as the second argument and the click silently
degraded to an ordinary navigation.

**What changed.** `data-table`'s renderer now forwards the DOM event from both of its
call sites — the row's own click handler and the hover "open record" button, whose
handler had already bound the event as `e` for `stopPropagation` and still did not pass
it on. `plugin-view`'s `ObjectView` forwards it from `handleRowClick` to the component's
own `onRowClick` prop. The payload's contents are unchanged: this is a forward, not a
redefinition.

**Declarations widened with the hops, and only those.** `DataTableSchema.onRowClick`
(`@object-ui/types`) and `ObjectViewProps.onRowClick` — plus the `onRowClick` that
`ObjectView` hands a host's `renderListView` — now declare
`(record, event?)`. `ObjectViewProps` is exported from `@object-ui/plugin-view`'s entry,
so this moves a published declaration. Source-compatible in both directions: a
one-parameter handler still satisfies the widened prop, and the second parameter is
spelled `any`, so a handler that annotated it `React.MouseEvent` is not refused
contravariantly.

**Not in this change.** `ObjectDataTableSchema.onRowClick` (`@object-ui/types`) feeds
the same `data-table` channel and therefore now receives the payload too, while still
declaring one parameter. It is reported separately rather than widened here.
