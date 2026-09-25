---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): `requiredPermissions` on `record:details`, `record:highlights` and `record:related_list` is an ADR-0066 capability set, read fail-closed — it used to pass for every reader of the object

These three record blocks carried the same block-level gate objectui#10058
repaired on `record:quick_actions`, byte for byte, and were untouched by it.
Each evaluated every declared name through the permission context's
OBJECT-ACTION path, whose second argument is the closed object-action enum —
not the ADR-0066 system capability set the same word names on `action`, `app`,
`field` and `bulkAction`.

Under the stock `/me/permissions` provider that path maps eight verbs (`read`,
`view`, `create`, `update`, `edit`, `delete`, `import`, `export`) and sends
everything else to the object's `allowRead` bit. So a declared gate naming a
capability nobody holds opened for every reader of the object, with no refusal,
no warning and no log — and five members of the enum itself (`manage`, `admin`,
`share`, `configure`, `execute`) were swallowed by the same tail, none of them
being in that map either.

All three now read `hasCapabilities` over the reported `systemPermissions` and
gate fail-closed: an unheld or unrecognised capability hides the block. The
object name leaves the verdict, because a system capability is not
object-scoped — on `record:details` and `record:highlights` the old
`&& objectName` conjunct was a second silent fail-open, skipping the declared
gate entirely for a block rendered with no object name in its record context.

Two calls deliberately do NOT move. `record:related_list`'s automatic
child-object read gate still asks the object-action path about `read`, which is
the question it means to ask, and `can()`'s own semantics are untouched
everywhere else.

⚠️ Unchanged residual, shared with every other capability gate in the tree: a
provider that never REPORTS capabilities (`systemPermissions` absent — the
role-based `PermissionProvider`, or a backend predating ADR-0066) still opens
these gates. That is `hasCapabilities`'s ruled unreported-vs-empty doctrine
(objectui#4656) and this change does not move it. A REPORTED empty array is a
real answer and gates strictly.
