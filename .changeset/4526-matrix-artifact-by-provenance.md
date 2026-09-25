---
'@object-ui/app-shell': minor
---

The permission matrix no longer locks a tenant's own permission set as if a code package shipped it
(objectui#4526).

At environment scope the permission editor decides whether a set is backed by a code-package artifact,
and for such a set it offers editing only where the `permission` type allows overlay. That decision read
the layered envelope's `code` layer and excluded only the `sys_metadata` sentinel. The sentinel holds
only on the save path: boot-time rehydration re-registers each stored row under its real package id, so
a set the tenant authored can come back with a code-looking package id, and the editor then rendered the
whole matrix read-only, with no Save, for a set the tenant owns.

The editor now also asks ADR-0010 `provenance` on the same envelope, the source the generic metadata
editor already uses for its own two-tier gate. A set whose provenance is `org` stays editable. A set a
code package ships (`provenance: 'package'`) is still read-only unless the type allows overlay, and an
envelope with no provenance keeps the previous reading.

Unchanged and accepted as known behaviour: on a single-kernel host the server does not apply its artifact
tier, so a code-declared set it would accept at environment scope still renders read-only here.
