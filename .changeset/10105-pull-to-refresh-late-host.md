---
'@object-ui/mobile': patch
---

fix(mobile): `usePullToRefresh` arms on a host that mounts after the first render (objectui#10105)

The hook returns an object ref, so it cannot see when a consumer attaches it.
It used to bind its touch listeners in an effect keyed only on its handlers and
`enabled`, which read `ref.current` once. A view whose first render is a
loading screen has no host at that moment. When the host appeared, none of the
effect's keys had changed, so it never ran again and the pull gesture did
nothing, with no error. The listeners now follow the element the ref points at
after each commit: they bind when it appears, move when it is replaced, and are
released when it goes away or the consumer unmounts.

Measured on this branch, on the internal-fetch path (the view fetches its own
rows): the gesture was dead on `ObjectCalendar`, `ObjectGrid` and
`ObjectTimeline` and now arms and refetches. `ListView` renders its host on the
first render and was not affected.

Product-visible:

- Nothing changes in what renders while loading.
- Inside `ListView`'s grid view, a pull now also shows `ObjectGrid`'s own
  indicator next to `ListView`'s. Before this fix the grid's listener was dead
  there. The calendar and timeline views inside `ListView` already showed two
  indicators before this change. One pull still triggers one refetch.

The exported signature and return type of `usePullToRefresh` are unchanged.
