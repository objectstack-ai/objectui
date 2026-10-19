---
'@object-ui/app-shell': patch
---

A console route's view no longer holds the boot splash after the route's data is in (objectui#12980, part 2).

`AppContent` loads each route view (page, dashboard, report, record, search, the metadata admin, the app designer, the marketplace) as a separate chunk. That chunk used to be requested only when the console chrome first rendered the route, so the route suspended there even with the chunk cached. Its fallback is the boot splash, and React keeps a fallback it has just shown for its reveal throttle, so the splash stayed about 0.28 s after the route's data had loaded, on every open.

The route's chunk is now requested as soon as `AppContent` knows the route, at the same time as the route's metadata reads. A view whose chunk has loaded by then renders together with the chrome and draws no splash. A view whose chunk is still loading shows the splash in its slot until it arrives, as before.
