---
'@object-ui/app-shell': patch
'@object-ui/i18n': minor
---

The Marketplace's install answers now say what the runtime served (objectui#12098).

- **An install-local answered `hotLoaded: false`.** The runtime installed the package, but its running kernel could not register it (objectstack#22695, the lenient path for a cloud-fetched manifest). The package loads at the runtime's next restart. The package page used to say the app "should now appear in the app switcher" and refresh the app list. The catalog's "Your organization" strip said "Installed {name}" and sent the metadata-refresh signal. Both now say: installed, loads when the runtime next restarts, not in the app switcher until then. Neither refreshes the app list. `hotLoaded: true` is unchanged.
- **An upgrade waits for the new version's app.** After a cloud install into this environment, the console waits until the runtime serves the package's app (objectui#12087). On an upgrade, the stale kernel still serves the OLD version's app under the same `_packageId`, so the wait ended on its first read and the console kept the pre-upgrade list. The runtime now stamps each app it registers with `_packageVersion` (objectstack#22689). The wait now also matches the version that the install answer names (`installation.version`). An app served without `_packageVersion` (a runtime from before that change) is accepted on its id, as before. An answer that names no version waits on the id alone. The catalog strip's wait matches the version the same way.

**Locale key.** `marketplace.install.localLoadsAtRestart`, in all ten packs. `TranslationKeys` gains it.

**Clause-②: yes (widening)**: one locale key added to `@object-ui/i18n`'s published packs, which widens `TranslationKeys`. No export, prop or schema key is added, and no spec type is imported.
