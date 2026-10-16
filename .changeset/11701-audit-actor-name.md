---
'@object-ui/console': patch
---

The console's Audit Log page now names who made each change, and its actor filter picks a user instead of taking a typed id (objectui#11701).

- **Actor column.** The page's `/api/v1/data/sys_audit_log` read now asks for `$expand=user_id`. `user_id` is the log's lookup to `sys_user`, so the server returns each actor's user record in place of the id, in the same request. The column shows the user's name, and hovering over it shows the user id. When the server cannot resolve the user, because the user was deleted or the viewer may not read them, it returns the bare id, and the column shows that id. A change with no user, where `user_id` is empty, reads "System". Hovering over it shows the recorded service principal (`svc:NAME`), if there is one.
- **Detail drawer.** The Actor row shows the user's name with the full user id below it. A change with no user shows "System" and the principal.
- **Actor filter.** The free-text "user id" box is now the `sys_user` lookup from `@object-ui/fields`, the same picker a lookup field to users gets. It lists users by name, and choosing one filters the log by that user's id. Removing the chosen user, or using "Clear filters", removes the filter.

**Clause-②: no.** No export, prop, type member or i18n key is added or removed. The page's own labels stay English literals. The lookup uses its existing translated strings.
