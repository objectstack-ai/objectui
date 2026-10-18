---
'@object-ui/app-shell': patch
---

Setup's permission-set and position holders offer Add and Remove only to a
caller holding the grant the server asks for those writes (objectui#12082).

A permission set's holders (`AssignedUsersSection`) and a position's holders
(`PositionHoldersSection`) offered Add and a per-row Remove to whoever reached
the page. Reaching Setup is not that grant: the Setup app asks `setup.access`,
and a caller can hold it while the server refuses their write of an assignment
row at its object CRUD step. objectstack's shipped organization administrator
set is such a caller: it holds `setup.access` and is read-only on both
assignment objects. That administrator was offered writes the server refused.

- **Add** creates a junction row under the item, so it reads the `relatedNew`
  row of the affordance-to-grant map (the create grant), the row a related
  list's Add existing reads. **Remove** deletes one, so it reads
  `relatedRowDelete` (the delete grant). Each is asked of the assignment
  object, `sys_user_permission_set` or `sys_user_position`, with its schema as
  the registry serves it.
- A closed row withholds its affordance: the Add button and the picker it
  opens, and each row's Remove. The holders still list, since listing them
  asks only to read.
- With no permission provider mounted every grant reads open, as before.

No row is added to `AFFORDANCE_GRANTS`, and no export, prop or type changes.
