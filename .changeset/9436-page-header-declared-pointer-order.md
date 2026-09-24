---
'@object-ui/components': minor
---

fix(components): the record page H1 ranks the declared `nameField` above `titleFormat`, the ADR-0079 order

⚠️ Behaviour change: what the H1 shows. Declared `minor` under this repo's
fixed-group versioning. Executes ruling C1 on objectui#9436.

`PageHeaderRenderer` (`page:header`, the H1 of the synthesized record page)
used to try the object's `titleFormat` template BEFORE its declared name
pointer. The protocol ranks them the other way. `@objectstack/spec`'s
`titleFormat` describe says "an explicit nameField now takes precedence",
ADR-0079 D3 says the same, and `getRecordDisplayName` already resolves the
name that way. So on an object declaring both, the H1 showed one field
while gallery, calendar, search and related lists showed another.

The header now resolves its title in this order:

1. an explicit `schema.title`;
2. the declared pointer: `nameField`, then its deprecated `displayNameField`
   alias. This rung is new, and it only applies when the pointer holds a value
   on the record;
3. `titleFormat`, rendered with the header's own interpolation, including
   i18n option labels, exactly as before;
4. the type-aware derivation, then the record-key rung, then
   `${objectLabel} ${id}`, all unchanged.

A pointer that is blank on a record still falls through to the template.
Objects that declare a pointer and no `titleFormat`, and objects that declare a
`titleFormat` and no pointer, render exactly as before.

**Upgrade effect.** Any object that declares BOTH a `nameField` (or
`displayNameField`) and a `titleFormat` whose rendering differs from that
field's value now shows the field's value as its H1. objectui's own
`examples/**` and `apps/**` declare no `titleFormat` at all. The first-party
objects this reaches are ObjectStack's platform objects. Measured once, at
objectstack `61609edf`, not re-derived by any gate here:

- 16 platform objects' H1 moves.
- 11 of them move to another field's value: `sys_import_job`,
  `sys_job_queue`, `sys_job_run`, `sys_session`, `sys_setting`,
  `sys_migration_journal`, `sys_activity`, `sys_audit_log`, `sys_comment`,
  `sys_sharing_rule` and `sys_webhook`.
- The other 5 declare `nameField: 'id'`, so their H1 becomes the raw record
  id: `sys_approval_action`, `sys_approval_approver`, `sys_approval_request`,
  `sys_automation_run` and `sys_http_delivery`.

This is a known consequence of the ruled order, not a regression to work
around in the renderer. The fix belongs to those objects' metadata in
ObjectStack: designate a formula field as the `nameField`, as the `titleFormat`
describe itself advises for a composite title.

`DetailView` and the `record:details` H1 dedupe (`@object-ui/plugin-detail`)
move to the same order in the same release, and the pointer is read through
`@object-ui/core`'s newly exported `declaredNameField`.
