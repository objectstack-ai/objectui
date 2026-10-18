---
'@object-ui/app-shell': patch
---

Studio's Interfaces pillar edits an object's list view (objectui#11823, step 1). The Properties panel of an `object` leaf used to say that nothing is edited there. It now edits the list view the canvas beside it shows: the columns (add, remove, drag or move up and down), the filter and the sort.

- **Which view.** The view the canvas opens, read from the nav entry the way the running app reads it. An entry that names a view (`viewName`) edits that view. Any other entry edits the object's default list view: the view flagged `isDefault`, else `OBJECT.default`, the name the platform gives a container's default `list`.
- **Where it is saved.** In the package draft, as a `view` metadata item (`{ name, object, viewKind: 'list', config }`), through the metadata draft write the other Studio editors use, with their version guard and autosave. Publishing the package publishes it with the rest of its drafts.
- **A view that does not exist yet** is created by the first edit, seeded with the columns the running app shows for an object with no view.
- **The canvas shows the edit at once.** It renders the panel's view, unsaved changes included, as the running app renders that list. An object entry now previews the list the running app opens: the object's default list view or, for an object with no list view yet, the default columns the running app shows. Before, it drew a plain grid of the object's fields.
- **A read-only package** shows the panel with every control disabled, and nothing is saved.

A studio-canvas leaf of any other type keeps its "nothing is edited from this panel" statement. Nothing is added to the package entry: no export, prop, type member or language-pack key. The panel's copy lives in the designer's own string tables (en and zh).
