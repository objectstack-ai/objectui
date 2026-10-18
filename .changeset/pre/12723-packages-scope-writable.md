---
'@object-ui/app-shell': patch
---

Setup → Packages: the Scope badge now reads the server's `writable` verdict for its writable / read-only half (objectui#12723). A marketplace install has no `scope` and the server marks it not writable, but every scope-less row used to be badged "Writable". Such a row now reads "Read-only". A row the server marks writable reads "Writable" whatever its scope. A read-only row keeps its System, Cloud or "Read-only · code" badge. The list row and the detail sheet read the same verdict.

Clause-②: no
