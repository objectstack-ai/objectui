---
'@object-ui/app-shell': patch
---

The console asks for recent activity only when the signed-in user may read it, and a failed read no longer shows as "No recent activity" (objectui#12081, item 8).

The header bell's Activity tab, the `global:notifications` page block and Home's activity card share one `sys_activity` read. It went out for every signed-in user on every page. A user whose permission sets grant no read on `sys_activity` (every non-admin on a deployment whose app sets do not name it) got `403` each time, and all three surfaces then said "No recent activity".

- **No read without the grant.** The feed now checks the user's read permission on `sys_activity` from the permissions the console already loads (`/auth/me/permissions`). A user without it gets no request. The bell offers no Activity tab, and Home shows no activity card. When permissions are not loaded (no permission provider is mounted, or the permissions request failed), the read still goes out as before.
- **A failed read says so.** The Activity tab and Home's card now show "An unexpected error occurred." when the read fails, a refusal included, and "Loading…" while it is in flight. "No recent activity" appears only when the read has answered with no rows.
- **The previous user's rows are not reused.** The server returns only the activity on records the reader can open. A sign-out keeps the console running, so the cached rows could be shown to the next user who signed in on the same tab. The cache is now kept per signed-in user.

Clause-②: no. Nothing is added to or removed from the package entry, and no locale key is added. `AppHeader`'s props are unchanged: rows a host passes as `activities` are shown as an answer, as before.
