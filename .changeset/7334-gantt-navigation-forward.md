---
'@object-ui/plugin-list': patch
---

Forward a list view's authored `navigation` down the gantt view-schema path
(objectui#7334).

`ObjectGantt` owns a record drawer of its own and resolves
`schema.navigation ?? { mode: 'drawer' }`, classifying four overlay modes
(`drawer` / `modal` / `split` / `popover`). Nothing ever put `navigation` on the
node it receives — `ListView`'s shared `baseProps` declares no such key and the
`case 'gantt'` branch added only the data keys — so that fallback was the only
branch ever taken. A gantt view authoring `navigation: { mode: 'page' }` (or
`modal`, or `split`) opened a drawer instead, with no diagnostic. The key was
already authorable and already read; this restores declared = enforced. No new
authorable key is added.

The key is forwarded on the `case 'gantt'` branch and deliberately **not** on
the shared `baseProps`, because every other child view resolves this same
question through the `onRowClick` that `baseProps` already carries:
`ObjectGrid`, `ObjectGallery`, `ObjectKanban`, `ObjectMap`, `ObjectTimeline` and
`ObjectTree` hand that callback to `useNavigationOverlay` unconditionally, and
the hook gives an external `onRowClick` full priority over any `navigation` — so
on `baseProps` the authored config would arrive there only to be outranked.
`ObjectCalendar` is the one that would genuinely change behaviour: it mirrors
gantt's `navIsOverlay ? undefined : onRowClick`, so an authored non-overlay mode
would stop it suppressing the host handler. Gantt is the only branch where
forwarding settles the question rather than splitting it, because its wrapper
drops host props entirely (objectui#7210 / objectui#7222) and there is no
`onRowClick` there to outrank anything.

A view that authors no `navigation` still gets **no** key, so the component's
`drawer` default is unchanged for every gantt in the product today.
