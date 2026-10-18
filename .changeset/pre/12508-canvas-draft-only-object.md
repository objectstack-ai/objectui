---
'@object-ui/app-shell': patch
---

The Studio's Interfaces canvas no longer asks for the schema of an object that has only a draft (objectui#12508).

Opening such an object's entry in the Interfaces pillar used to mount the runtime records grid, which read `GET /meta/object/NAME`, got a 404, logged `getObjectSchema failed … MetadataNotFoundError` twice and showed "Error loading grid". The canvas previews what the running app would show, and an unpublished object has no schema and no records there yet, so it now says "This object is not published yet" and that publishing the package shows its records here. A published object renders the records grid as before, and after a publish the same entry shows the grid without a reload.
