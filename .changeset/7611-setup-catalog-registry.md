---
'@object-ui/app-shell': minor
'@object-ui/fields': minor
'@object-ui/console': minor
---

The Setup catalog for positions and permission sets reads the registry. It is built from the metadata-admin list and editors in their environment scope, not from new pages (objectui#7611, objectstack ADR-0131 D3/D7).

- **The environment scope (`?scope=environment`).** `…/metadata/position` and `…/metadata/permission` with this parameter list every item the registry serves for the type, including the platform's own sets. Without it, the list shows one project package's items, as Studio does. Every link the pages emit keeps the scope: the item links, the create link and the editor's breadcrumb. `ENVIRONMENT_SCOPE_QUERY` is exported for hosts that route their own URLs onto it.
- **Gated for Setup.** A caller without `manage_metadata` gets no create affordance on the list and a read-only editor, and the page says why. Under `single`, the reason is that the platform administrator defines these items and the caller's organization assigns them. Under a wall, it is that the operator defines them for every organization. The generic editor and the permission-set editor now apply this caller gate wherever they render. The metadata door refuses that caller's save anyway; this states the refusal before the click.
- **The active switch.** The catalog list has an active column and an active/inactive filter. The switch writes the catalog row's `active` flag through the data door, which is today's behaviour on the Setup object pages. Only `catalog-activation.ts` reads and writes catalog rows, and it is what changes when the server's activation ledger accepts these types. An item with no catalog row shows a dash with the reason.
- **Holders.** In the environment scope, the permission-set editor shows who holds the set under its definition, and the position editor shows who holds the position. A set's holders are read by name: grants come from the `permission_set` column, and the positions that distribute the set come from the registry's position definitions (`permissionSets`). They are no longer read from `sys_position_permission_set` or `sys_position` rows. A new grant still carries `permission_set_id`, because the server does not accept a grant by name alone yet. A position is assigned by its name.
- **The sharing-rule recipient picker lists the `position` registry** through the console's metadata store. It no longer reads `sys_position` rows. Without a metadata store mounted, the `position` kind falls back to the plain text input.
- **The console's `system/roles`, `system/positions` and `system/permissions`** now go to the catalog list, not to the object pages.
