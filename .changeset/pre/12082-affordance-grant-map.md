---
'@object-ui/core': minor
'@object-ui/permissions': minor
'@object-ui/plugin-form': patch
'@object-ui/app-shell': patch
'@object-ui/fields': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-grid': patch
'@object-ui/plugin-detail': patch
'@object-ui/console': patch
---

A create form asks its fields the create question, so a role that may create
records but not edit them can fill and submit the form (objectui#12082). Every
console affordance that offers a write now reads the grant it exercises from
one map.

**The defect.** A create form gated each field on `checkField(object, field,
'write')`, whose fallback for a field the permission set does not mention is
the object's `allowEdit`. Under a grant of `allowCreate: true, allowEdit: false`
every field of the create form rendered disabled, the outbound filter stripped
every field from the body, and the save posted an empty record that the server
refused for its required fields — while the server accepts the same create.

**The server's insert rule, which the create question follows.** The server's
field-level write step refuses a write that names a field whose explicit
field-level entry has `editable: false`; a field with no entry passes it, and
object admission decides the operation (`allowCreate` for an insert,
`allowEdit` for an update). So a create-form field now reads its explicit entry
when there is one and the object's create grant when there is none. A field the
permission set marks `editable: false` stays disabled and out of the body.

**Clause-②: yes (widening)**

- `@object-ui/core` exports the affordance-to-grant map: `AFFORDANCE_GRANTS`
  (one row per affordance: the CRUD-affordance bit it needs, the object grant it
  exercises and, for an affordance that offers fields, the field question it
  asks), `resolveAffordance` (managed-object policy ∧ the server's effective API
  operation set ∧ the caller's grant, with the row's `userActions` predicates
  surfaced only when all three allow it), `resolveFieldAffordance`,
  `formFieldsAffordance`, and their types (`ConsoleAffordance`,
  `FieldAffordance`, `AffordanceGrant`, `FieldAffordanceGrant`,
  `AffordanceGrantRow`, `AffordanceGrantPrincipal`, `FieldAffordancePrincipal`,
  `AffordanceSource`, `AffordanceVerdict`).
- `@object-ui/permissions`: `checkField`'s action accepts `'create'` beside
  `'read'` and `'write'`. `MePermissionsProvider` answers it from the explicit
  field entry when there is one and from `allowCreate` otherwise; the
  role-based `PermissionProvider` answers it as it answers `'write'`.

**Behaviour, by package.** With no permission provider mounted every grant
still reads open, as before.

- `@object-ui/plugin-form`: every `ObjectForm` layout's fields and outbound
  filter ask the question of the form's mode (create or edit). The form-wide
  lock, with its "You don't have permission to …" notice, also engages when the
  caller's object grant for the form's mode is denied, not only when the
  managed-object policy or the effective API operation set closes it. A
  create-mode `MasterDetailForm`'s line cells ask the create question of the
  child object, since every line there is a new record.
- `@object-ui/app-shell`: the record page's Edit and Delete (and the record
  body's in-place editing) read the caller's update / delete grant; they read
  none before. The import wizard's write targets ask the create question, so a
  caller offered Import keeps every field the insert accepts. List New / Import,
  the related lists and the Attachments panel read the map with the verdicts
  they had.
- `@object-ui/fields`: a lookup's "Create new" reads the create grant (and the
  managed-object policy and operation set) of the object the field references;
  it read no grant before.
- `@object-ui/plugin-grid`: row Edit / Delete, in-place editing, the template
  download and the add-record row read the map; the add-record row now also
  honours the object's managed-object policy and effective `create` operation.
- `@object-ui/plugin-detail`: `record:details` in-place editing reads the
  caller's update grant; the detail header's object gate adds the effective
  operation set.
- `@object-ui/plugin-list` and `@object-ui/console`: bulk Delete, the
  inline-edit toggle and the profile page's language field read the map with
  the verdicts they had.
