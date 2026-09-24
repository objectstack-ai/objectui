---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): `record:details` no longer reads `requiredPermissions` — the contract deliberately does not declare it on that block

`@objectstack/spec`'s `RecordDetailsProps` is a strict schema that does not
declare `requiredPermissions`, on purpose (the family docblock on that schema
says so), so a `record:details` document carrying the key is refused at
publish. The renderer nevertheless read it and hid the whole block behind it,
which made that gate reachable only through metadata the contract rejects.

By maintainer ruling on objectui#10200 the renderer stops reading the key on
this block: a `record:details` node carrying `requiredPermissions` now renders
its body whatever capabilities the viewer holds, and the "Insufficient
permissions to view details." notice is gone. If the spec later declares the
key on this block under ADR-0066, the renderer will read it then, following
the contract.

⚠️ This supersedes the `record:details` part of the objectui#10155 entry
(the ADR-0066 capability gate on the three record blocks).
`record:highlights` and `record:related_list` are unchanged and still gate on
the key as that entry describes. Server-side record and field access is
unaffected: this block-level gate was a browser-side hide, never a data-access
control.
