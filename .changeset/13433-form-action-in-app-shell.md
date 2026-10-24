---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

A `type: 'form'` action fired inside an app opens its form inside that app, headed by a label, with a Cancel (objectui#13433).

The form opened on the app-less `/forms/:name`, so the app's sidebar, switcher and branding disappeared. The page was headed by the raw view name (`showcase_task.form`) and had only Submit, so the browser's Back button was the only way out without saving.

- The console now also serves the form at `/apps/:appName/forms/:name`, inside the app's own shell. The record page, object list and page action navigators open a form hop there when their own route is an app route. The console-wide runtime has no route of its own, so its form hops keep the app-less route. `/forms/:name` is unchanged and still serves every other link.
- A form view with no label and no form `title` is headed by its object's label in the session's language. An authored view label or `title` still wins.
- The internal form has a Cancel. It goes back to the page the form was opened from. With no such page (a cold link) it goes to the record being edited, else to the app's home, or to Home on the app-less route. The public `/f/:slug` form has no Cancel.
