---
'@object-ui/app-shell': patch
---

A position approver is read through the spec's registry binding, `{ source: 'registry', type }` (objectstack#22710): its readable label and its designer picker come from the position registry, and the picker stores the position's name (objectui#7611, ruled objectstack#22865 Q3b → B).

- **The approval panel and the override dialog.** When the bundled spec binds `position` to the registry (the console objectstack ships injects that spec), a pending `position:<name>` approver now reads as the position's label, read through the console's metadata store (`ensureType('position')`), else as the prettified name. It used to fall through to the opaque-id truncation and read `positi…ager`. Who holds the seat is still read from `sys_user_position`.
- **The flow designer's approver Value cell.** A `registry` entry in the approval node's published `xRef.sources` is no longer dropped. A kind bound that way renders a select over that metadata type's items (`GET /api/v1/meta/<type>`) and commits the item's name, with a manual-entry toggle; a stored name the registry does not list shows flagged `(not found)`, and an empty registry leaves the text box. It used to fall back to a lookup over `sys_position` rows, or to a plain text box on the console objectstack ships.
- **Unchanged.** A `data` binding (`user`, `team`, `department`, and `position` under the installed spec 17.7.0) still renders the record lookup and still resolves its label from its directory object. No authoring surface changes, so `objectui validate` and the strict faces are unchanged. The type that admits the registry member before the installed spec declares it is marked for removal when objectui moves to spec 18.
