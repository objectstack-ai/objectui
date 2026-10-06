---
'@object-ui/app-shell': minor
---

"Recently Accessed" shows each item's own label, in the current language, and a visit that does not change the list no longer writes the `ui.recent` preference (objectui#11678).

The route tracker used to store a label it made from the route's machine name at visit time: a dashboard labelled "Delivery Operations" was listed as "Showcase Ops Dashboard", and stayed in English after switching to 中文. An object, dashboard, page or report entry now stores its identity only, `type` and `name`, and every surface that lists recent items (the Home cards and rail, the sidebar's Recent group, Studio home, the command palette) labels it when it renders, through the new `useRecentItemLabel` hook. That hook reuses the resolver each kind already has: the navigation target label for an object or a dashboard, and the page's or report's metadata label through the `pageLabel` / `reportLabel` bundle lookup. An item whose metadata is not loaded shows its machine name until it is. A record keeps the title it was visited under, and a Studio metadata item its name.

Lists already stored in the old shape are read by identity, which was always in the entry's `id`; their stored label is dropped, so they show the current label on first render.

`RecentItemsProvider` now refuses to write a list equal to the one it holds, whoever reports the visit: revisiting the item already at the head of the list changes nothing and writes nothing, and its `visitedAt` stays the time it became the most recent entry. Going from an object's list to one of its views no longer saves the list a second time.

**Breaking (types):** `RecentItem` is now a union. `RecentNamedItem` (`object`, `dashboard`, `page`, `report`) carries `name` and no `label`; `RecentTextItem` (`record`, `metadata`) carries `label`. `addRecentItem` takes `RecentItemInput`, so a call that passes a `label` for an object, dashboard, page or report no longer compiles, and code that reads `item.label` off a recent entry should call `useRecentItemLabel()` instead. `useRecentItemLabel`, `RecentItemLabelResolver`, `RecentItemInput`, `RecentItemType`, `RecentNamedItem` and `RecentTextItem` are new exports of `@object-ui/app-shell`.

**Clause-②: yes (narrowing).** The package entry gains six exports, and `addRecentItem` refuses the label-carrying shape it used to take for those four kinds.
