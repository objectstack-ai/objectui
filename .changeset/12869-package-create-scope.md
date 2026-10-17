---
'@object-ui/app-shell': patch
---

Studio's new-package dialog no longer offers a scope. Its Advanced section used to list `cloud`, `system` and `project`, and the server refuses the first two when a package is created. A new package now takes the server's default, `project`. Editing or viewing an existing package still shows its scope, read-only.
