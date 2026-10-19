---
'@object-ui/app-shell': patch
---

The console sidebar's capability gate no longer loads the whole object registry in an app created in the console (an app with no package). It asks, by name, every object the app list's entries require (`requiresObject`, in each app's `navigation` and `areas`), so the sidebar, the app's landing and the bell's activity roster gate each entry exactly as the whole registry would. A by-name read that fails leaves its entry shown, as a failed whole-registry read does. In a package app, the objects the app's `areas` entries require are now asked by name too, so an area entry whose object the deployment lacks is hidden. No export, prop or type member changes.
