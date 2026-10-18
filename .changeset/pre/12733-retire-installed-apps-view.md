---
'@object-ui/app-shell': minor
'@object-ui/cli': minor
---

The separate Installed Apps view is retired (objectui#12733, ruling B on objectstack#23892). Setup → Packages filtered to Marketplace is the one list of what is installed (objectui#12675), and objectstack#23933 points the install-local plugin's Installed Apps entry straight at it. This is breaking for a host that used one of the retired names; it is marked `minor` under this repository's version policy.

- **Export `MarketplaceInstalledPage`.** FROM: `@object-ui/app-shell` exported it, and it redirected to Packages filtered to Marketplace. TO: there is no such export, and importing it fails to compile.
- **SDUI widget `marketplace:installed-list`** (also registered as `app-shell:marketplace:installed-list`). FROM: registered, and it redirected to the same URL. TO: not registered. A page that still names it draws the unknown-component panel, and `objectui check` no longer counts it among the known component types.
- **Routes `system/marketplace/installed`**, in the no-active-app branch and the app branch. FROM: both redirected to the same URL. TO: neither exists. The path now matches `system/marketplace/:packageId`, so an old bookmark opens the package page for a package id `installed`, which the catalog does not have.
- **The Marketplace page's "Installed (N)" button** opens `/apps/APP/component/developer/packages?source=marketplace` directly, with no redirect hop. APP is the app the page was opened under, and `setup` when there is none.

The widget's module also leaves the `sideEffects` array of `@object-ui/app-shell`.

Fix for each retired name: link to `/apps/APP/component/developer/packages?source=marketplace` (Setup → Packages, Source = Marketplace) instead.

Clause-②: no (narrowing)
