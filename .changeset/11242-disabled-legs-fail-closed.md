---
'@object-ui/components': minor
'@object-ui/plugin-grid': minor
'@object-ui/react': minor
---

fix: a row-menu action gated through `disabled` stays disabled until the permissions payload has loaded, in a grid and in a related list's table, and an `<ActionProvider>` answers `current_user` in the runner's own gates

A custom row action whose `disabled` asks `current_user.can(...)` has no answer until the
signed-in user's permissions have loaded. In the row menu of a grid (`RowActionMenu`) and
of a data table (the related list's rows), that unanswerable gate used to leave the item
ENABLED, so `disabled: "!current_user.can('account', 'delete')"` offered the action to
everyone while the page loaded, and kept offering it where the permissions never load (the
`/forms/:name` route, a standalone embed). Both menus now render a `disabled` predicate that
cannot be evaluated as DISABLED, the way `page:header` already does, and the console names
it once. This is the rule for the key, not a special case for `can`: a `disabled` that
faults for any other reason (a misspelled root such as `nope.x == 1`) is disabled too,
where it used to be enabled. An absent, empty or blank `disabled` is still not disabled.
The built-in Edit and Delete keep their fail-soft `disabledWhen`.

`<ActionProvider>` (`@object-ui/react`) now binds the signed-in user from the surrounding
`ExpressionProvider` as `current_user` on its runner. The runner checks an action's
`disabled` again when the action runs, and that check used to fault on `current_user` unless
the page also mounted `record:quick_actions`, `record:alert` or a dashboard, so a user who
held the permission clicked an enabled header action and was told "Action is disabled".
The check now answers `current_user.can(...)` under any provider mounted inside the
predicate scope. On the runner's gates `user.can(...)`, `ctx.user.can(...)` and
`os.user.can(...)` still fault, because there `user` is the host's own user object; write
`current_user.can(...)`.
