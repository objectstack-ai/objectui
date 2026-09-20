---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): `record:quick_actions.requiredPermissions` is an ADR-0066 capability set, read fail-closed — it used to pass for every reader of the object

The block-level gate is published as "Hide the whole bar unless the current
user holds every named permission on this object". It evaluated each name
through the permission context's OBJECT-ACTION path, whose second argument is
the closed object-action enum — not the ADR-0066 system capability set the same
word names on `action`, `app`, `field` and `bulkAction`.

Under the stock `/me/permissions` provider that path maps eight verbs (`read`,
`view`, `create`, `update`, `edit`, `delete`, `import`, `export`) and sends
everything else to the object's `allowRead` bit. Measured on that provider with
a REPORTED-empty capability set and `allowRead: true`: `crm.manage` and
`manage_users` both answered `true` — **a declared permission gate that passed
for every reader of the object, with no refusal, no warning and no log**. The
same fallback swallowed five members of the enum itself (`manage`, `admin`,
`share`, `configure`, `execute`), none of which is in that map either. Under
the role-based `PermissionProvider` the identical declaration was instead
refused for everyone when the object carried a permission config and allowed
for everyone when it did not — one declaration, two providers, neither
consulting the caller's capabilities.

The bar now reads the capability path (`hasCapabilities` over the reported
`systemPermissions`) and gates **fail-closed**: an unheld or unrecognised
capability hides the whole bar. The object name is no longer part of the
verdict — a system capability is not object-scoped, and the old
`objectName`-present guard was a second silent fail-open that skipped the
declared gate entirely on a bar rendered outside a record context.

**Behaviour change, in both directions.** A deployment whose backend reports
`systemPermissions` now hides a bar whose declared capabilities the user does
not hold — which is what the key always said it did — and shows one whose
capabilities the user holds even where the object's read bit is off. A provider
that never REPORTS capabilities (`systemPermissions` absent: the role-based
provider, a backend predating ADR-0066, or no provider mounted) still opens the
gate; that is `hasCapabilities`'s own unreported-vs-empty doctrine, shared with
every other capability gate in the tree, and this change does not move it. A
REPORTED empty array is a real answer and gates strictly.

`perms.can()` itself is untouched: no other caller moves, and the full
before/after truth table of both stock providers is pinned as unchanged.
