---
'@object-ui/components': patch
---

An `action:bar` member authored with `component: 'action:menu'` or
`component: 'action:group'` now renders, and a `?runAction=` deep link to it now
runs it (objectui#10345).

`action:bar` used to hand such a member, alone, to the `action:menu` or
`action:group` renderer. Both read their actions from `schema.actions`, which a
single action does not carry, so they rendered nothing. The action vanished from
the toolbar with no error, and a deep link to it was consumed from the URL and
ran nothing.

On an `action:bar`, an action's `component` now says where it goes, as the
spec's comment on the key says ("Defaults to 'button' or 'menu_item' based on
location, but can be overridden"):

- `action:menu` puts the action in the bar's one overflow ("More") menu, however
  few actions the bar has. It does not use one of the `maxVisible` inline slots,
  which is how `page:header` already reads the key. In the menu, the actions
  that did not fit in `maxVisible` come first, then the menu-placed ones, each
  in the bar's order, then the separator and the system actions.
- `action:group` renders the action inline, as an ordinary action button, in a
  button group with the `action:group` members next to it in the inline row. A
  different inline action between two of them starts a new group. Each grouped
  action still counts toward `maxVisible`.

A moved action keeps its own `visible`, `disabled` and `requiredPermissions`
gates, and a deep link to it runs once, as it does for an inline action.
`action:button` and `action:icon` members render as before.
