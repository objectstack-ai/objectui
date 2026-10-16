---
'@object-ui/types': minor
---

`NamedListView` declares `requiredPermissions`, the list view's audience key from `@objectstack/spec` 18 (objectui#12341, the objectui half of objectstack#22611 ruling A).

The spec declares `requiredPermissions: string[]` on the list-view shape: a list of capabilities, all required. The server enforces it (objectstack PR #22731): `GET /api/v1/meta/view` lists only the views a caller may open, a by-name read of a view the caller cannot open answers `403 PERMISSION_DENIED`, and an object's `listViews` are pruned the same way. `NamedListView` was the one list-view type in this package without the key, so a TypeScript author writing it there got a type error on a valid key. It now accepts the key, typed by reference as `ListViewSchema['requiredPermissions']` (`string[] | undefined`), and refuses a value that is not a list of strings.

The `list-view` node (`ListViewSchema`) and `ObjectViewSchema.listViews` already took the key from the spec by reference; nothing changes for them. No renderer reads the key, and the console adds no client-side check: the server decides who sees a view.
