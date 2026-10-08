---
'@object-ui/app-shell': minor
'@object-ui/i18n': patch
'@object-ui/console': patch
---

The Studio landing (`/studio`) lists the packages the author was last in, above its package cards (objectui#11863). A visit to a package's pillar builder (`/studio/PKG/TAB`) is recorded as a recent `package` entry. Before this, a Studio visit recorded nothing: the route tracker reads `/apps/APP` routes only.

The entry stores the package's identity and no display text, as objectui#11678 did for objects, dashboards, pages and reports: its `id` is `package:PKG`, its `name` the package id, and its `href` the bare `/studio/PKG` route, which opens the Data pillar. The landing labels each entry from the package list it loads, so a renamed package shows its new name, and a package the list no longer has shows its id, as a missing object does. Moving between pillars of one package leaves the list as it is, so nothing is written. The package-less scope (`/studio/~org`) is not a package and records nothing. A principal the Studio entry gate refuses never reaches the builder, so records nothing.

The app sidebar's Recent group and the metadata-admin app's home leave package entries out: neither loads the full package list, so they could only draw a package as its id. Home's Recently Accessed and the command palette's recent group already list other kinds only.

**Clause-②: yes (widening).** The exported `RecentItemType` union gains `'package'`, so `RecentNamedItem`'s `type` and `RecentItem` carry it too, and a host's exhaustive `switch` or `Record` over the union must handle it. `useRecentItemLabel` takes an optional argument, `{ packages }`: the package list (`id` and `name` per row) that labels a `package` entry. A call with no argument resolves every other kind as before and draws a package entry as its id. No export is added or removed. `@object-ui/i18n` gains one key in all ten packs, `home.recentApps.itemType.package`, the label of the new kind.
