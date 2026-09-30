---
'@object-ui/plugin-detail': minor
---

fix(plugin-detail): `DetailView`'s header and the `record:details` H1 dedupe rank the declared `nameField` above `titleFormat`, the ADR-0079 order

⚠️ Behaviour change: which heading `DetailView` shows, and which row
`record:details` hides. Declared `minor` under this repo's fixed-group
versioning. Executes ruling C1 on objectui#9436, alongside the same change to
`PageHeaderRenderer` in `@object-ui/components`.

- **`DetailView` header.** `resolveDisplayTitle` used to try `titleFormat`
  right after the view-level `primaryField`, and before the object's declared
  pointer. The declared pointer (`nameField`, then its deprecated
  `displayNameField` alias) now sits between the two, so on an object
  declaring both, the heading is the pointer's value. `primaryField` still
  wins over everything. A pointer that is blank on the record still falls
  through to the template. A `primaryField` or pointer that the loaded
  permission policy denies the viewer falls through the same way, as if blank
  (objectui#10434).
- **`record:details` H1 dedupe.** The body hides the one row the record page
  H1 already shows. It used to check the template first, which mirrored the
  header's old order. With the header moved, that would have printed the
  pointer's row directly under an identical H1. On a single-field template it
  would also have hidden a row the H1 no longer showed. The dedupe now reads
  the declared pointer first: when it holds a value the viewer may read
  (objectui#10434), that field's row is the one hidden and the template is not
  consulted. The template outcomes ruled on
  objectui#8351 are unchanged wherever the template really is the H1, which
  is when no pointer is declared or the pointer is blank on the record.

**Upgrade effect.** It is the same set of objects as the header change: any
object declaring both a `nameField` (or `displayNameField`) and a
`titleFormat` that renders something else. Measured once, at objectstack
`61609edf`, and not re-derived by any gate here, that reaches 16 ObjectStack
platform objects. For 5 of them (`sys_approval_action`,
`sys_approval_approver`, `sys_approval_request`, `sys_automation_run` and
`sys_http_delivery`), `nameField: 'id'` makes the heading the raw record id.
That is a known consequence of the ruled order. The fix belongs to those
objects' metadata in ObjectStack: a formula field designated as `nameField`.
