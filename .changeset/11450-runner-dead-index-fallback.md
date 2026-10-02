---
'@object-ui/runner': patch
---

The runner drops a fallback welcome page that could never render (objectui#11450).

When no page document loaded for `/`, `App.tsx` set an error and also stored a built-in "Welcome to Object UI" page reading `No index page found.`. The error branch renders first whenever an error is set, so that page was never shown: `/` with no document has always rendered the 404 block, `Page not found: /`. The unreachable page is removed. What the runner renders does not change.
