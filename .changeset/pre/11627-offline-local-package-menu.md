---
'@object-ui/app-shell': patch
---

On a runtime with no marketplace that still mounts install-local (an offline boot, `OS_CLOUD_URL=off`), a local install's Details page now offers its local menu: re-seed sample data, purge sample data and uninstall from this runtime (objectui#11627).

Installed Apps links each local install's Details to the marketplace package page. That page answered a marketplace-off runtime with the "App Marketplace is turned off" notice and nothing else, so the local menu below that check could not be reached and no install-local request was ever issued. Now, when the runtime config reports `features.installLocal` and the viewer is an admin, the page draws the package's header (manifest id and installed version) and its local menu above the same notice. The menu issues the same `POST /api/v1/marketplace/install-local/MANIFEST_ID/reseed-sample-data` and `.../purge-sample-data` calls as on a marketplace-on runtime. The page finds the install by the id Installed Apps put in the link (the ledger entry's `packageId`), and the menu acts on its manifest id.

Everything that needs a marketplace stays refused as before: the page sends no catalog request and no cloud-installation probe, and it draws no install-to-cloud button, readme or version list. A viewer who is not an admin, a runtime that does not mount install-local, and a package that is not a local install all see the notice alone, as before.

**Clause-②: no.** Nothing on the package entry changes: no export, prop, type member or i18n key is added. `MarketplacePackagePage` takes no props, and the strings it draws already existed.
