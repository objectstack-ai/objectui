---
'@object-ui/app-shell': patch
---

An object page's view tab, and the breadcrumb that names the open view, draw the label of a view the object document embeds as the server served it (objectui#11336).

Since `@objectstack/spec` 17.6.0 (objectstack#21072) the server translates the `listViews` an object document embeds, from `objects.OBJECT._views.KEY` and with a published edit kept over the packaged catalog, as it already did for `/meta/view` documents. The console still ran its own catalog over those labels a second time, so a published edit to such a view drew as the packaged string. A view counts as served now when its key is in the served `/meta/object` document's own `listViews`, read before the console merges view documents into it, as well as when a `/meta/view` document carries its name. Its label is drawn as given. A view only the console derives, such as a stack container's expansion, is still named by the client catalog.

Against a server older than that release, a view the object document embeds arrives untranslated and is now drawn as authored.

**Clause-②: no.** Nothing on the package entry changes. The predicate (`isServedView`) and its hook (`useServedViewItems`) are not exported from `@object-ui/app-shell`.
