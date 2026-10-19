---
'@object-ui/app-shell': minor
'@object-ui/plugin-list': minor
'@object-ui/react': patch
---

A list's `addRecord` Add button opens the create form on a console page and on the console's object list (objectui#13089).

- **Page `list-view` nodes.** The console's page host now serves the record-form create to a list that names no `relationshipField` and has no parent: a page `list-view` node. So `addRecord: { enabled: true }` draws its Add button, and a click opens the create form for the listed object. A related list whose parent did not resolve is still served nothing, so it draws no "+ New" that would open a child form linked to no parent. No Edit, Delete or row click is served to a list without a parent.
- **`list-view.addRecord` is a published input** of the `list-view` and `list` registrations. `enabled` and `position` are read; `mode` and `formView` are not.
- **The console's object list.** A saved view that declares `addRecord.enabled` used to draw an Add button whose click did nothing, also for a viewer who may not create. The button now opens the header New's create, and is withheld wherever that New is not offered or is greyed.
- **`editMode: 'page'`.** A create linked to no parent, from the record-actions bridge, now opens an `editMode: 'page'` object's full-page create route, as the object list does, instead of the overlay.
- **`ResolveRelatedRecordActionsInput`** (`@object-ui/react`) documents what an input without `relationshipField` asks for: an object-scoped list's handlers. No type or member changes.
