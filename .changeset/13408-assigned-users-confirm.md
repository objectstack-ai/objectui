---
'@object-ui/app-shell': patch
---

Setup → Permission Sets → Assigned Users: Remove asks first, and the add picker offers organization members only (objectui#13408), the same shape as the positions page (objectui#13337).

- Removing a direct grant opens a confirm that names the person; nothing is sent until it is confirmed, and Cancel writes nothing.
- Add user reads the active organization's `sys_member` rows when it opens and offers only the users they name, so a user removed from the organization is no longer offered (the server already refuses such a grant). A refused membership read is said in the server's words and the picker stays shut. With no active organization, or no `sys_member` object registered, the picker lists every user it may read, as before.
- The membership read is one helper shared by both pages (`organization-members.ts`).
