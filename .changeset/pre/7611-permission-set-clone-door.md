---
'@object-ui/app-shell': minor
---

"Clone to customize" on a packaged permission set calls the server's clone door (objectui#7611, objectstack ADR-0126 §7.1).

- **What the admin does.** On a permission set a code package ships, "Clone to customize" opens a dialog that asks for the copy's new machine name and label. "Create copy" sends `POST /api/v1/security/permission-sets/:name/clone` with exactly `{ name, label }` (objectstack#22881). The server copies the set's whole definition, leaves out the keys it declares (among them `adminScope` and `isDefault`), and saves the copy as an ordinary permission set authored in the environment.
- **What it no longer does.** The editor used to run the `clone_permission_set` record action: it read the set's `sys_permission_set` row and posted the row's columns back to the data door. On a database with no such row it refused with "no sys_permission_set record named NAME was found", and it refused outright on a server whose object published no such action. It reads no row and runs no record action now. The two refusal strings are gone. The record action itself is unchanged and still shows on the `sys_permission_set` object page while the server publishes it.
- **Where the copy opens.** In the routed editor the copy opens in place, writable, and keeps the query string, so a copy made in Setup (`?scope=environment`) opens in Setup. The server's notice (what was not copied, and that nobody holds the copy yet) is shown on it as sent. An embedded host has no route, so the copy is announced by name with the same notice.
- **Refusals.** Every refusal the door answers (a malformed name, a name already taken, a caller without `manage_metadata`, an unknown set, the catalog unavailable) is shown in the dialog in the server's words, and the editor stays on the set. A caller without `manage_metadata` is not offered "Clone to customize", as before.
- **Assigned users.** In the Setup catalog, a permission-set name the server does not hold yet (one that only the first Save will create) no longer shows the Assigned users section, where Add could only be refused. The section appears once Save creates the set.
- **Texts.** The lock's guidance, the clone hint and the refused-save message now say the copy is a permission set authored in this environment; they said it was owned by your organization.
- **Server floor.** The door ships with objectstack#22881. On a server without it the request is refused, and the dialog shows that answer's message, or its HTTP status when it carries none.

Clause-②: no. No export, prop or published locale key moves; the strings added and removed belong to the metadata admin's own table.
