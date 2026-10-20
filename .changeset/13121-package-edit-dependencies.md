---
'@object-ui/app-shell': patch
---

The package edit dialog (Studio / Setup) now edits a package's `dependencies`. The row is no longer locked once the package exists, and saving sends it to `PATCH /api/v1/packages/:id` beside the name, description and version when the author changed it; emptying it sends `{}`, which clears the declaration. The server's `400 VALIDATION_ERROR` for a malformed row and `422 WRITABLE_PACKAGE_REQUIRED` for a read-only package show in the dialog, which stays open.
