---
'@object-ui/i18n': patch
---

**`marketplace.installedAdditiveNote` says what uninstall does now, in all ten packs** (objectui#12684). The note on a loaded marketplace row's Uninstall (its tooltip and accessible description on Setup › Packages) said the running kernel keeps the app registered until the runtime restarts. objectstack's `DELETE /api/v1/marketplace/install-local/ID` now withdraws the package from the running kernel at once (objectstack#21576). The note now says that the app leaves the running kernel at once, with its permission sets and their grants, that the cached manifest is deleted so the package does not load at the next start, and that the records stored in its objects stay in the database. Each pack carries its own translation. The key's name and its plain-text shape do not change.

**Clause-②: no.** No export, prop or type changes; one existing value changes in each pack.
