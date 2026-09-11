---
'@object-ui/plugin-list': patch
'@object-ui/plugin-gantt': patch
---

Honour a gantt view's authored `navigation` — forward it down the gantt
view-schema path, and give the component a destination for the non-overlay
modes (objectui#7334).

**Leg 1, `@object-ui/plugin-list`.** `ObjectGantt` resolves
`schema.navigation ?? { mode: 'drawer' }` and classifies four overlay modes
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

**Leg 2, `@object-ui/plugin-gantt`.** `ObjectGantt` now supplies its own
`onNavigate`, so a click under an authored `page` or `new_window` actually
reaches the record page. Leg 1 alone would have made `page` reachable and inert:
`useNavigationOverlay`'s `page` branch calls `onNavigate` and returns with no
fallback, this component supplied none, and its registration hands it no host
`onRowClick` either — both carriers empty at once, turning an authored `page`
from "a drawer opens, which is wrong" into "the click does nothing". The
destination is the record-page href the component already computes for the
drawer's full-page link, so the two cannot diverge; same-tab navigation uses the
history plus `popstate` pair (matching `DashboardRenderer` and `PageHeader`),
and `new_window` now opens the app-prefixed href rather than the hook's
unprefixed fallback. No host prop is forwarded to the chart.

A view that authors no `navigation` still gets **no** key and still opens its
drawer, so the component's default is unchanged for every gantt in the product
today; an authored `none` stays inert.
