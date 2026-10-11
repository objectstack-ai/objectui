---
'@object-ui/app-shell': patch
---

An org install from the Marketplace catalog's "Your organization" strip, on a cloud-managed environment, now waits until the environment serves the installed package's app before it refreshes the metadata cache (objectui#12097). The package page has done this since objectui#12087.

A cloud install answers once the control plane has written the installation. The environment's runtime then rebuilds its kernel and keeps serving the kernel from before the install until the rebuild lands (about 60 s, measured on staging for objectui#12087). The catalog page sent its metadata-refresh signal the moment the install answered. Every mounted metadata cache re-read its types on that signal and kept what it read, which was the pre-install app list, so the strip said "Installed" and the app never appeared in that tab.

- **Wait.** The catalog page now runs the same wait as the package page (`waitForServedApp`), on the row's `manifest_id`: it reads `GET /meta/app` past the cache, at once and then every 5 s for up to 5 minutes, until an app's `_packageId` is that manifest id. Only then does it send the refresh signal.
- **Say what is happening.** In the strip, above its package cards and under the installed package's name, it shows the package page's three states in the package page's words: "Deploying the app…" while it waits; that the app is ready, with "Open {name}", once it is served; and, when the wait expires, that the install was recorded but the app has not appeared yet, with "Check again". It no longer says "Installed {name}" before the app is served, and on expiry it refreshes nothing.
- An install-local runtime is unchanged: it registers the package before it answers, so the strip says "Installed {name}" and refreshes at once, as before.

No language-pack key is added: the three states reuse the package page's `marketplace.install` keys (`deploying`, `deployed`, `deployTimeout`, `openApp`, `checkAgain`). No export, prop or type on the `@object-ui/app-shell` entry changes.
