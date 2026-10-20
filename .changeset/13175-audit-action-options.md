---
'@object-ui/console': patch
---

The Audit Log's Action filter offers the actions the server declares for `sys_audit_log.action` (objectui#13175).

The filter read a hand-kept list of seven actions that claimed to mirror the server's declaration and had fallen behind it. Actions the server declares and writes rows for, `read`, `platform_admin_standing_change`, `login_failed` and `account_locked` among them, could not be picked, so an admin could not narrow the log to refused sign-ins or account lockouts.

The filter now offers the declared options of the `action` field in the `sys_audit_log` object metadata the console already loads, in declared order and labelled as declared, and the hand-kept list is removed. Declaring an action on the server is all it takes to offer it. The query is unchanged: the chosen value is still sent as an exact `action` match. An action with no local badge tone shows the neutral outline badge, as before.

While that object metadata is not loaded, or when the console is not served the `sys_audit_log` object, the filter offers only "All actions".
