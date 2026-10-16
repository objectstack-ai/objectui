---
'@object-ui/i18n': patch
---

**`marketplace.installedAdditiveNote` says what uninstall does now, in all ten packs** (objectui#12684). The note on a loaded marketplace row's Uninstall (its tooltip and accessible description on Setup › Packages) said the running kernel keeps the app registered until the runtime restarts. objectstack's `DELETE /api/v1/marketplace/install-local/ID` now withdraws the package from the running kernel at once (objectstack#21576). The note now says that the app leaves the running kernel at once, with its permission sets and their grants, that the cached manifest is deleted so the package does not load at the next start, and that the records stored in its objects stay in the database. Each pack carries its own translation. The key's name and its plain-text shape do not change.

**The Uninstall confirm and result lines say the same thing.** `marketplace.uninstall.confirm` (the question on both the Packages row and the package page), `marketplace.uninstall.successInList` and `marketplace.uninstall.successInDetail` no longer say the app stays loaded until the next restart, and no longer tell the operator to restart the runtime. They say that the app leaves the running kernel at once with its permission sets and their grants, that the cached manifest is removed, and that the records stored in its objects stay in the database. Every interpolation token each value used is kept. The not-loaded texts (`confirmNotLoaded`, `successNotLoaded`) do not change.

**Clause-②: no.** No export, prop or type changes; existing values change in each pack.
