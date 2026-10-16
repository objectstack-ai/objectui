---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The console home's top half follows the approved home artboard (objectui#12601): a search field in the top bar, a greeting with a one-line work summary, two compact builder chips, and 56 px app tiles with Setup moved off the tile row.

- **Search on `/home`.** `HomeLayout` now mounts the console's command palette, the same one `⌘K` opens inside an app. It is scoped to Home's host app: the app the user was last in, else their first openable app. The top bar draws its search field in the middle zone from `lg` up, 420 px wide from `xl`, labelled "Search apps, records, pages…". `⌘K` works on the page too. When there is no app to host the palette, none is mounted and no field is drawn. The internal-form route, which uses the same layout, gets the same field.
- **Greeting.** The greeting is 24 px / 600. The tagline is replaced by a 13 px summary line: "You have N approval(s) waiting today", from the approvals count the bell badges, or "Nothing is waiting for you today" at zero.
- **Builder entries.** The two full-width cover cards "Build an app" and "Start with a template" become two 32 px chips at the greeting's right, for admins only. A withheld chip keeps its disabled state and explains itself through a tooltip wrapper (a focusable wrapper, and an `aria-describedby` on the button pointing at a visually hidden reason). The reason is no longer a visible paragraph under the cards. The `home-build-app`, `home-start-template`, `home-authoring-gate-reason` and `home-marketplace-disabled-reason` test ids are unchanged.
- **Apps.** The "Your apps" heading is 15 px with a count pill. Tiles are 112 px wide, with a 56 px icon and a 13 px name on one line. Under the name, an 11 px line says when the user last had the app open ("Opened 2 hours ago"), read from the recent-items store: the newest entry the user opened inside that app. An app with no entry left in the store shows no line. Setup is no longer a tile: it is a muted "System Settings" link at the heading's right, shown when the user can open Setup. An admin who may install apps gets a trailing dashed "Add app" tile, which opens the marketplace route the "Browse App Marketplace" link opens and has the same gate.
- **Content column.** The page's content column is 1120 px wide, with 28 px above the first section and between sections.

New locale keys, in all ten packs: `home.search`, `home.summary.approvals` (a count family), `home.summary.none`, `home.addApp` and `home.appOpened`. No key is removed.

**Clause-②: yes (no published name changes).** No export, prop or type on either package entry is added, removed or renamed. `HomeLayout`, `HomePage` and `AppHeader` keep their props. What changes is what they draw.
