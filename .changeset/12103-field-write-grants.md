---
'@object-ui/core': minor
'@object-ui/permissions': minor
'@object-ui/plugin-detail': patch
'@object-ui/plugin-grid': patch
---

In-place edit on the record page and a list's in-cell edit honour the caller's field write grant, and the owner field honours the transfer grant (objectui#12103).

**What a caller saw.** A caller whose permission set marks a field `{ readable: true, editable: false }` was offered an editor for it in the record page's details body, in its highlights strip and in a list's grid cells, and Save answered 403 ("Field write denied"). The owner field was offered the same way to a caller without the transfer grant, and Save answered 403 ("requires the transfer grant"). Edit forms already refused both fields through `fieldWriteGate`.

**What changed.**

- **The map (`@object-ui/core`).** The `recordEdit` and `listInlineEdit` rows of `AFFORDANCE_GRANTS` gain `field: 'write'`, so the record page's in-place edit and a list's in-cell edit each ask every field the same update question an edit form asks, through `resolveFieldAffordance`. `FieldAffordance` therefore includes both rows.
- **The details body and the highlights strip (`@object-ui/plugin-detail`).** `DetailSection` and `HeaderHighlight` ask that question of each field. A refused field shows no pencil, does not enter the edit session on double-click, and stays a read display in edit mode. The strip and the body share one session and one Save, so they answer alike.
- **The grid (`@object-ui/plugin-grid`).** `ObjectGrid` marks a refused field's column not editable, so its cell keeps the read display while the rest of the row edits. Whether the grid is editable at all is still the object-level `listInlineEdit` verdict.
- **The owner field (`@object-ui/permissions`).** The server refuses an update that writes the record's owner (the field the `@objectstack/spec` constant `SystemFieldName` names `OWNER_ID`) unless the caller holds `allowTransfer` or `modifyAllRecords`. `MePermissionsProvider`'s `checkField(object, owner, 'write')` now answers with that grant, read with the spec's `objectPermissionGrants`. The `write` question is the server's update rule for a field, so every surface that asks it (edit forms, in-place edit, in-cell edit) offers the owner field only to a caller who may transfer the record. `checkField(object, owner, 'create')` is unchanged, because on insert the server stamps an empty owner to the caller and accepts the caller's own id. `MePermissionsResponse` declares the `allowTransfer` bit the endpoint already serves, and `@object-ui/permissions` now depends on `@objectstack/spec` directly.

**Unchanged.** With no permission provider mounted no field question is asked, so a standalone embed and the designer preview behave as before. The server still enforces every grant; this only stops the console from offering a write it would refuse.

**Clause-②: yes (widening).** `AFFORDANCE_GRANTS.recordEdit` and `AFFORDANCE_GRANTS.listInlineEdit` gain a `field: 'write'` member, which widens the `FieldAffordance` type by those two rows. `MePermissionsResponse`'s object entry declares an optional `allowTransfer?: boolean`. `checkField`'s action union is unchanged; its `write` answer narrows for the owner field only. No export, prop or language-pack key is added or removed.
