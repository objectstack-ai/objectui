---
'@object-ui/app-shell': minor
---

Setup's "Assigned users" on a permission set writes a new grant by the set's name alone (objectui#7611, after objectstack#22863, ADR-0131 stage 6b-2-pre).

- **Add.** The section creates `sys_user_permission_set` with `{ user_id, permission_set }`, where `permission_set` is the set's machine name. It no longer reads the set's `sys_permission_set` row and no longer writes `permission_set_id`, which no writer fills now. A set with no catalog row, such as a platform or package set on a database the platform no longer seeds rows into, is granted like any other; before, the section refused it with "This set has no catalog row yet" and wrote nothing.
- **A name the server's catalog does not hold** is refused by the server with `400` (`reference_not_found` at `permission_set`), and the section shows the server's message.
- **Remove** is unchanged: it deletes the direct grant's own row.
- **Server floor.** A server from before objectstack#22863 still requires `permission_set_id` on a grant, so there the add is refused with `400` and the section shows that refusal.

Clause-②: no. No export, prop or locale key changes; the two removed strings were the section's own copy.
