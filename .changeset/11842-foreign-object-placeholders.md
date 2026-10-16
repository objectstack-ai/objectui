---
'@object-ui/app-shell': patch
---

Studio's object inputs no longer suggest objects of other apps (objectui#11842).

In the flow inspector, the object input of a get, create, update or delete record node, a legacy action, a map's item object, a screen's object form and a time-relative trigger's sweep object showed an example object name as its placeholder: `contract`, `contracts`, `crm_account` or `showcase_task`. The view inspector's object input showed `e.g. crm_lead`. An author reads a placeholder as a suggestion, and in an app without that object the suggestion names something that will not resolve. These placeholders are gone. The flow inputs are the shared object picker, whose list offers the objects the app has, and the view's object input shows its own empty prompt.

Placeholders that do not name an object stay, and the values each input accepts are unchanged. The view inspector's `engine.inspector.view.objectPlaceholder` string leaves both designer locales. Nothing is added to the package entry: no export, prop or type member.
