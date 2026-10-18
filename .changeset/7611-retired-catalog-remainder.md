---
'@object-ui/plugin-detail': minor
'@object-ui/app-shell': minor
'@object-ui/core': minor
'@object-ui/data-objectstack': minor
'@object-ui/i18n': minor
'@object-ui/cli': minor
---

The object-page special cases for the retired permission-set catalog object are removed (objectui#7611, after objectstack's ADR-0131 stage 8 retired `sys_position`, `sys_permission_set`, `sys_position_permission_set` and `sys_capability`). A permission set is edited on its Setup metadata page, which reads the registry; none of the removed code ran anywhere else.

- **`@object-ui/plugin-detail`.** The `permission-facet-link` field widget (`PermissionFacetLink`, the read-only facet summary with a "Design in Studio" link) is deleted, with its `field:permission-facet-link` registration and the special cases in the detail section and inline edit. A field still carrying `widget: 'permission-facet-link'` renders with its declared type, like any unregistered widget.
- **`@object-ui/app-shell`.** The `sys_permission_set` record page no longer appends the assigned-users panel (`RecordPermissionAssignmentsRenderer` is deleted). The panel itself, `AssignedUsersSection`, stays on the permission-set metadata page.
- **`@object-ui/app-shell`: a permission set created from the Setup catalog is created live.** "New" on the permission-set page used to save a draft, while the set's editor edits the live set and reads no draft: the editor opened an empty set without the label, its Save wrote the grants live, and the draft stayed pending, so publishing it from Home replaced the grants with the empty create body. Outside a package binding the create now writes live (with the same first-write pin); under `?package=` it stays a package draft. A metadata type opts in with the registry entry's new `createLive`.
- **`@object-ui/data-objectstack`.** `getObjectSchema` no longer stamps the `permission-facet-link` widget onto the six `sys_permission_set` facet fields.
- **`@object-ui/core`.** `recordDelete` no longer asks a package-owned `sys_permission_set` row the reset question or toasts "reset": every record gets the delete question and the delete toast. `recordDelete.confirmText` takes only the translator (`{ t }`), and the injected data source needs only `delete`.
- **`@object-ui/i18n`.** The `perm.facet.*` keys and `objectActions.resetPackageSetConfirm` / `objectActions.resetPackageSetSuccess` are removed from all ten packs.
- **`@object-ui/cli`.** `field:permission-facet-link` is no longer a known schema type.
