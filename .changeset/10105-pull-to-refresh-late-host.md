---
'@object-ui/mobile': patch
---

fix(mobile): `usePullToRefresh` arms on a host that mounts after the first render, and one pull has one owner (objectui#10105)

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

Nested pull hosts now have one owner. `ListView` has its own pull host, and
so does the view it renders inside itself. A touch on the inner view bubbles
to `ListView`, so both used to respond to one pull. Before this change, the
calendar and timeline views inside `ListView` drew two "Pull to refresh"
strips for one pull, and arming the grid would have made its view do the
same. The gesture now belongs to the OUTERMOST armed pull host: an inner host
lets a pull go when an armed pull host is its ancestor in the DOM. So one pull
inside `ListView` draws one indicator, `ListView`'s, and runs one refetch,
which reloads the rows `ListView` hands the inner view. A view with no pull
host above it keeps its own pull. While it is armed, the hook marks its
element with a `data-pull-to-refresh-host` attribute; that attribute is how one
hook instance sees another, including across two copies of this package.

Product-visible:

- Nothing changes in what renders while loading.
- A pull inside `ListView` (calendar, grid or timeline view) shows one
  indicator instead of two, and still triggers one refetch.
- The pull gesture now works on those views when they fetch their own rows.

The exported signature and return type of `usePullToRefresh` are unchanged.
