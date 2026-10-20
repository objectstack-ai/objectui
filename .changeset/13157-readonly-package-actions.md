---
'@object-ui/app-shell': patch
---

The Packages sheet offers no write action on a read-only package (objectui#13157). It gated its actions on the package's `scope` being `system` or `cloud`, so a project-scoped or scope-less code package, or a marketplace install, offered Edit, Publish, Revert, Disable, Duplicate, Adopt loose items and Delete app while its own Scope badge read "Read-only", and the server refused each of them (`422 WRITABLE_PACKAGE_REQUIRED`, and `422 DUPLICATE_SOURCE_NOT_A_BASE` for Duplicate). The sheet now reads the badge's verdict, the row's served `writable`: those actions are offered only when it is `true`. View info and Export are offered on every package, kernel packages included. A disabled read-only package still offers Enable, which the server does not refuse. A writable package's sheet is unchanged.
