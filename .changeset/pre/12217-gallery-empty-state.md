---
'@object-ui/plugin-list': patch
---

An empty gallery draws the same empty state as an empty grid, translated, instead of "No items to display" in English (objectui#12217).

`ObjectGallery` used to draw one hard-coded English line, "No items to display", whenever it had no records, in every locale. It also ignored the view's authored `emptyState`, because `ListView` drew its empty state only for the `grid` visualization and handed an empty gallery the empty list.

- **Under `ListView`** (an object list or an interface list page shown as a gallery), the gallery now draws the grid's empty state. That is the view's authored `emptyState` (`title` and `message` resolved against the display locale, its `icon`) when there is one, and otherwise the localized default copy: the first-run message, or the no-matches message when the user's search or filters or the view's own filter emptied the list. The add-record action appears as it does on the grid.
- **Standalone** (an `object-gallery` node, or `ObjectView`'s own gallery path), the gallery draws the same component with what it knows. That is the localized first-run copy, or the view-filter message when its own `filter` emptied its own query. The `object-gallery` node declares no `emptyState`, and the standalone gallery has no add-record control.

The copy uses the `list.*` keys the grid already used, so every language pack already carries it. Nothing is added to the package entry: no export, prop, type member or language-pack key.
