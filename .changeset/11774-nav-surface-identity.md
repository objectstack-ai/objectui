---
'@object-ui/app-shell': patch
---

Studio's Interfaces rail tells apart nav entries that open the same object, and previews each one's data slice or named view (objectui#11774).

An app's navigation can hold several entries on one object: the plain list, slices of it (`filters`) and named views of it (`viewName`). The Interfaces rail identified an entry by its target alone, so every entry on that object was the same surface. Clicking a slice such as "Urgent Tasks" highlighted every entry on the object at once, previewed the whole unfiltered list, and a reload or a shared link landed on the first of them.

- **Highlight:** only the entry you clicked is active. Entries are told apart by their nav item `id`.
- **Preview:** the canvas shows what the running app opens for that entry: a `filters` entry previews its slice, read the way the app's data surface reads the entry's link, and a `viewName` entry previews that named view of the object.
- **Deep link:** the Interfaces pillar now writes the open entry's id beside `?surface=`, as `&nav=` followed by the id, so a reload or a shared link opens the same entry. A `?surface=` link without it, including every link made before this release, resolves exactly as before, and so does one whose entry no longer exists.

Apps whose entries each open a different object behave as before.
