---
'@object-ui/console': patch
---

A link from one doc to another in the docs portal now carries the console's base path (objectui#12686). The portal rewrites a doc body's `[x](./other_doc.md)` cross-reference to the docs route. It used to write `href="/docs/other_doc"` with no router basename. A plain left click worked, because the page hands it to the router, but under the `/_console` mount a new tab, a middle-click or a copied link went to the server path `/docs/other_doc` and answered 404. The href is now react-router's own href for that route (`useHref('/docs')`, the same source objectui#12233 used for record links), so it reads `/_console/docs/other_doc`, or `/docs/other_doc` on a root mount. A plain left click still navigates inside the app, a modifier click is left to the browser, and fragment links, the table of contents and external links behave as before.

Clause-②: no — an app-internal href gains the router basename. No prop, export or language-pack key changes.
