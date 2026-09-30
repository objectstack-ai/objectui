---
'@object-ui/components': minor
'@object-ui/plugin-detail': minor
'@object-ui/react': minor
---

fix: an action gated on `current_user.can(object, verb)` stays hidden until the permissions payload has loaded on every action `visible` surface, a `page:header` action gated through `disabled` stays disabled, and `record:quick_actions` can answer `current_user` at all

An action whose `visible` asks `current_user.can(...)` has no answer until the signed-in
user's permissions have loaded. On `action:group` (both display modes, and the group's own
`visible`), `action:icon` and a related list's toolbar, that unanswerable gate used to
SHOW the action, so a button meant for permission holders flashed up for everyone while
the page loaded, and stayed up where the permissions never load (the `/forms/:name` route,
a standalone embed). These renderers now treat a `visible` predicate that cannot be
evaluated the way `action:button` and `action:menu` already did: the action is hidden and
the console names it once. This is the rule for the key, not a special case for `can`: a
`visible` that faults for any other reason (a misspelled root such as `nope.x == 1`) is
hidden too, where it used to be shown.

On `page:header`, a `disabled` predicate that cannot be evaluated now renders the button
DISABLED instead of enabled, so `disabled: "!current_user.can('account', 'delete')"`
shows a greyed-out button until the answer arrives. This also applies to a `disabled`
predicate that faults for another reason. A header action's `visible` and `hidden`
predicates keep their fail directions.

`record:quick_actions` filters its actions against the action runner's context, which
held the host's `user` but never `current_user`, so `current_user.can(...)` and every
other `current_user.*` gate there hid the action for everyone, the users who hold the
permission included. `useActionEngine` (`@object-ui/react`) now binds the signed-in user
from the surrounding `ExpressionProvider` as `current_user`, so a quick action is shown
to users who hold the permission and hidden from those who don't, and while the
permissions are loading.
