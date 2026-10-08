---
'@object-ui/app-shell': patch
---

Four more editors stop asking for the layers of an item that was never published, so the browser console no longer logs a 404 for it (objectui#11799). The framework answers `GET /meta/:type/:name/layers` with a 404 for an item with no layer, and each editor already holds the answer that tells it so.

- **The Access pillar's OWD overview.** An object the package's published list does not hold is not asked for its layers while its draft is in hand, on open and on save. A published object is read as before.
- **The list-view panel of an `object` leaf.** The view's layers are read only when it has no pending draft, the one case the panel uses them. A view the panel created and nobody published no longer logs a 404 each time the leaf opens.
- **The metadata edit page.** The refresh after a save and the refresh after "Discard draft" reuse the page's own answer when its load found no layer, and the refresh after a create asks nothing: a draft makes no layer. The page's first load of a never-published item still reads `/layers`.
- **The permission matrix under a package.** A set the published set list does not hold (one "+ New" created) is not asked for its layers on open while its draft is in hand. A published set is read as before.

What each editor shows is unchanged. No REST answer, export, prop or type member changes.
