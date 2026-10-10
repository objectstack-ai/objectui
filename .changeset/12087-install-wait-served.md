---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

After a marketplace install into the environment the console is rendering, the package page waits until that environment serves the installed package's app, and only then refreshes and persists the app list (objectui#12087).

A cloud install answers once the control plane has written the installation. The environment's runtime then rebuilds its kernel and keeps serving the kernel from before the install until the rebuild lands (about 60 s, measured on staging). The page used to refresh the metadata cache the moment the install answered. That refresh read the pre-install app list, and the cache kept it, in memory and in the tab's session seed. The page said "Installed successfully", and the app never appeared in that tab.

- **Wait.** The page reads `GET /meta/app` past the cache, at once and then every 5 s for up to 5 minutes, until an app's `_packageId` is the package's manifest id. Only then does it drop the session seed, refresh the cache and send the metadata-changed signal. No app list read during the wait is persisted. The 5 minutes bound the wait; they do not estimate the rebuild.
- **Say what is happening.** Until the app is served, the dialog, and the page once the dialog is closed, show "Deploying the app…" (「正在部署应用…」). When it is served, they show that the app is ready and offer "Open {name}" (「打开 {name}」).
- **Say what is not known.** When the wait expires, the page says the install was recorded but the app has not appeared yet, names the possible reasons, and offers "Check again". It does not claim success, and it refreshes nothing.
- The install-time suggested audience bindings mount once the app is served, so their one read reaches the rebuilt runtime.
- An install into another environment shows the same success message as before. It no longer refreshes this console's own metadata, which that install did not change.

Five language-pack keys are added under `marketplace.install` (`deploying`, `deployed`, `openApp`, `deployTimeout`, `checkAgain`), in all ten packs. No export, prop or type changes on the package entries.
