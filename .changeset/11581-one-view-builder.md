---
'@object-ui/app-shell': patch
---

"Save as view" now saves a Kanban view the platform accepts, and both Create View doors save the same view from the same dialog choices (objectui#11581).

The Create View dialog persists a new view through two doors: "Save as view" on the object data
page, and Create View on the object page (the view tab bar's add button, and the view-config
panel's create mode). The two assembled the saved view separately, and only the object page's
door copied the view's columns into the type blocks that carry a field list of their own. So:

- a Kanban saved through "Save as view" had no `kanban.columns`, which `@objectstack/spec`
  requires ("Fields to show on cards"), and the platform's view write door refused it;
- a Gallery saved through "Save as view" had no `gallery.visibleFields`, so its cards showed
  nothing under the title, while the same choices on the object page showed the view's columns.

Both doors now build the view through one builder. Each door still supplies its own columns (the
data page's current columns, or the object's default business columns), and "Save as view" still
folds the page's URL conditions into the view's `filter`. The builder writes those columns into
`kanban.columns`, and into `gallery.visibleFields` when the gallery declares none. A view created
on the object page is saved exactly as before.
