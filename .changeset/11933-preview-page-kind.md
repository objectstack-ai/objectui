---
'@object-ui/app-shell': patch
---

Studio's page previews draw the page's own kind, as the running app does (objectui#11933): the live preview beside an `html` or `react` page's source, and the Interfaces page canvas in Run mode.

Both previews wrote the page's kind into the node `type` only. `PageRenderer` reads the kind from `pageType`, so it fell back to a record page: an `app` or `home` page previewed at the record width and without its title heading, while the running app drew it with both. The two previews and the running app's page view now build the `{ type, pageType }` pair with one shared builder, so each preview draws a page's width and title heading as the app does. A `record` page previews as before, and an empty page draft still shows the "add components" message. The running app's page view renders exactly as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
