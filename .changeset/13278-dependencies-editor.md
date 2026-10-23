---
'@object-ui/app-shell': patch
---

The package dialog's Dependencies row is now an author-facing editor (objectui#13278). It used to be the spec form's raw JSON box under the developer hint "widget object-fields — falling back to JSON until a custom renderer is registered", because the manifest's `dependencies` is a string map the spec form has no renderer for.

The row now lists one line per dependency, a package name and a version range, with add and remove, in create, edit and view mode. It sends the same flat map as before: in edit mode only when changed, and `{}` when every row is removed. An empty or duplicate package name is flagged under its row and keeps save disabled. The ranges are judged by the server, whose refusals render in the dialog as before.

Nothing is added to the package entry: no export, prop or type member. The new copy lives in the metadata-admin designer's own string tables (en and zh).
