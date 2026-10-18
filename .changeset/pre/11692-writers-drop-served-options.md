---
'@object-ui/data-objectstack': minor
'@object-ui/app-shell': patch
'@object-ui/plugin-designer': patch
---

Objects with a picklist-bound field save again from the OWD overview, the Setup fields and objects pages, the metadata-admin embedded-item editor, and `MetadataService.saveFields` (objectui#11692).

The runtime serves a field that names a shared picklist (`picklist: 'NAME'`) with the options it resolved from the list. The authoring door refuses `options` beside `picklist`, with `422 INVALID_METADATA` at `fields.FIELD.options`, and the refusal covers the whole object. objectui#10202 fixed the two designers that host the select-field editor. These writers also seed their save from a served object read, so they sent the resolved options back and were refused, whatever had been edited:

- **Studio → Access → OWD overview.** Changing an object's sharing model and saving was refused.
- **The Setup fields page** (`MetadataFieldsPage`). Editing any field of such an object was refused.
- **The Setup objects page** (`MetadataObjectsPage`). Relabelling such an object was refused.
- **The metadata-admin embedded-item editor** (`EmbeddedItemEditor`, opened from an object's fields, indexes or validations). Saving any item of such an object was refused.
- **`MetadataService.saveFields`.** A field list built from the served object was refused.

Each now leaves `options` out of every field that names a picklist, before the PUT. A field without `picklist` keeps its inline `options` unchanged, and no other key is touched.

`dropServedPicklistOptions` is now exported from `@object-ui/data-objectstack`. It is the served-to-authored conversion these writers apply, and it moves here from `@object-ui/app-shell` (it was not exported there), because `@object-ui/plugin-designer` does not depend on `app-shell`. It is for code that builds an object PUT from a served read. `MetadataClient.save` does not apply it, and neither do `MetadataService.saveObject` and `MetadataService.saveMetadataItem`, which read nothing: a body that pairs `picklist` with `options` without a served read behind it is still refused by the server, with its prescription.
