---
'@object-ui/app-shell': patch
---

The README's "Setup half of an item" now says what objectstack's shipped organization administrator set does on the assignment objects: it creates and removes rows on `sys_user_position` and `sys_user_permission_set` and never edits them, bounded on the server by the delegated-administration gate, so that administrator sees Add and Remove on a position's and a permission set's holders. No behaviour change.
