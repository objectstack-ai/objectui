---
'@object-ui/app-shell': patch
---

Studio's live preview of a source page draws the page's own kind, as the running app does (objectui#11933).

The preview beside an `html` or `react` page's source wrote the page's kind into the node `type` only. `PageRenderer` reads the kind from `pageType`, so it fell back to a record page: an `app` or `home` page previewed at the record width and without its title heading, while the running app drew it with both. The preview and the running app's page view now build the `{ type, pageType }` pair with one shared builder, so the preview draws each kind's width and title exactly as the app does. A `record` page previews as before. The running app's page view renders exactly as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
