---
'@object-ui/components': patch
---

An `action:icon` now runs an action it receives with `autoTrigger` set, the same
way `action:button` and `action:menu` do (objectui#10274).

`action:bar` renders each inline action with the renderer its `component` names.
So an action authored with `component: 'action:icon'` reached `action:icon` with
the host's `autoTrigger` flag on it, and `action:icon` ignored the flag. A
`?runAction=` deep link to a list toolbar action shown as an icon was therefore
consumed (removed from the URL) and ran nothing, with no notice.

`action:icon` now calls the same shared auto-trigger hook as the other two
renderers:

- It runs the action once, through its own click handler, so confirm dialogs,
  parameter dialogs and toasts apply exactly as they do on a click. Re-renders do
  not run it again.
- If the action's own declared `visible` hides the icon, the action is not run.
  A warning toast names the action, and development builds log a console
  diagnostic, as the other two renderers do (objectui#4191).
