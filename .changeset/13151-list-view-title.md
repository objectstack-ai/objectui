---
'@object-ui/app-shell': patch
---

Studio's list-view panel names the view by its display name, not its machine name (objectui#13151).

On an object's nav item in Studio → Interfaces, the Properties panel used to head itself with the list view's qualified name (for example `site_visit.default`) whenever the view had no label or did not exist yet, and its notice repeated that name ("There is no list view site_visit.default yet."). Now:

- A view with a `label` is headed by that label, as before.
- A view with no label is headed by its object's display name and its role: "Site Visit · Default view" for the object's default list view, or "Site Visit · open" for a view a nav item names by its key. The object's name is the one the nav rail shows for that object: its published label, else the label of its pending draft, else its machine name.
- The not-created and not-a-list-view notices name the view by the same title.
- The qualified name stays on the panel as a small monospace line under the header, the way Studio's rows show a machine name.

What the panel saves is unchanged: it still writes the view under its qualified name. Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
