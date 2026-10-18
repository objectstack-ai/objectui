---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
'@object-ui/console': patch
---

The help menu gains an About entry on every console bar (the tenant console and the control plane draw the same header). It opens a small dialog naming the build the console was compiled from: `VITE_APP_VERSION` from the build's environment, or, when that is unset, the short sha of `HEAD` that the console's Vite config reads from git at build time. A console built with neither says "Unknown build" in words instead of showing an empty field.

The dialog and Sentry's release fallback read the same value through one reader, so the two can no longer name different builds. The text comes from new `help.about*` keys in all ten language packs.
