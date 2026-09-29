---
'@object-ui/plugin-view': patch
---

fix(plugin-view): `ObjectView` fetches only for views that draw the rows, and a re-read keeps them on screen

`ObjectView` fetches the rows for its non-grid views itself and hands them to the
inner view as `data`. Two things were wrong with that fetch.

- **It ran for views that never draw the rows.** The gate was a deny-list (`grid`,
  `tree`, `chart`), so every other view type was read on mount and re-read on every
  data-invalidation event. That included `gantt`, whose registered renderer hands
  its chart the schema alone and queries for itself, and every view type with no
  renderer case (`page`, `list`, `detail`), which falls through to the grid. The
  gate is now an allow-list of the view types whose renderer draws the rows:
  `kanban`, `calendar`, `gallery`, `timeline` and `map`. The others keep reading
  and refreshing through their own query, as they already did, without a second
  request beside it. A tree no longer runs its own query twice when the view's
  rows arrive.
- **A re-read flashed the loading placeholder.** Every run set `loading`, bus
  re-reads included, and a calendar handed rows swaps them for "Loading calendar…"
  while that is true, so each bus event flashed the calendar. A run that issues the
  same request as the rows on screen answer is now a re-read: the rows stay until
  the new ones arrive. The first load for a request still shows the placeholder, and
  a failed re-read is still logged the way a failed first load is.
