---
'@object-ui/plugin-detail': minor
'@object-ui/app-shell': minor
'@object-ui/core': minor
'@object-ui/data-objectstack': minor
'@object-ui/i18n': minor
'@object-ui/cli': minor
---

The object-page special cases for the retired permission-set catalog object are removed (objectui#7611, after objectstack's ADR-0131 stage 8 retired `sys_position`, `sys_permission_set`, `sys_position_permission_set` and `sys_capability`). A permission set is edited on its Setup metadata page, which reads the registry; none of the removed code ran anywhere else.

**Breaking (narrowing; scored `minor` per the fixed group's version policy).** Each removal below shrinks a published face:

- **`@object-ui/core`: `recordDelete.confirmText`.** FROM `recordDelete.confirmText({ objectName, t }, record)` TO `recordDelete.confirmText({ t })`. A package-owned `sys_permission_set` row no longer gets the reset question or the "reset" toast: every record gets the delete question and the delete toast. Fix: drop `objectName` and the second argument.
- **`@object-ui/i18n`: pack keys.** FROM `perm.facet.*` (`none`, `more`, `objects`, `fields`, `rls`, `tabs` with their plural slots, `adminScope`, `designInStudio`, `designInStudioHint`) and `objectActions.resetPackageSetConfirm` / `objectActions.resetPackageSetSuccess` in all ten packs TO absent. Fix: a consumer that still asks for one keeps its own copy (inline `defaultValue` or its own bundle).
- **`@object-ui/plugin-detail`: the `field:permission-facet-link` registry key.** FROM a registered field widget (the read-only facet summary with a "Design in Studio" link, also special-cased in the detail section and inline edit) TO unregistered. A field still carrying `widget: 'permission-facet-link'` renders with its declared type, like any unregistered widget. Fix: drop the `widget` hint, or register an own widget under that key.
- **`@object-ui/cli`: `objectui check`'s known schema types.** FROM `field:permission-facet-link` known TO unknown, so `objectui check` reports a node of that type. Fix: as above.

**Behaviour changes, not narrowings:**

- **`@object-ui/data-objectstack`:** `getObjectSchema` no longer stamps `widget: 'permission-facet-link'` onto the six `sys_permission_set` facet fields (that object is no longer served).
- **`@object-ui/app-shell`:** the `sys_permission_set` record page no longer appends the assigned-users panel. The panel itself, `AssignedUsersSection`, stays on the permission-set metadata page.
- **`@object-ui/app-shell`: a permission set created from the Setup catalog is created live.** "New" on the permission-set page used to save a draft, while the set's editor edits the live set and reads no draft: the editor opened an empty set without the label, its Save wrote the grants live, and the draft stayed pending, so publishing it from Home replaced the grants with the empty create body. Outside a package binding the create now writes live (with the same first-write pin); under `?package=` it stays a package draft.

**Widenings:**

- **`@object-ui/core`:** the data source `recordDelete.run` is injected with needs only `delete` (it no longer calls `findOne`).
- **`@object-ui/app-shell`:** the metadata-resource registry entry gains an optional `createLive`, which a type sets when its edit page writes the live item.

Internal, not reachable from a published entry: the `PermissionFacetLink` component (never exported from `@object-ui/plugin-detail`), `RecordPermissionAssignmentsRenderer` (never exported from `@object-ui/app-shell`), and `ObjectStackAdapter`'s private `applyFieldWidgetOverrides`.
