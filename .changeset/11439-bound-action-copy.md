---
'@object-ui/i18n': patch
'@object-ui/react': patch
---

An action's translated copy is now read from ONE bundle node, chosen by the object the action belongs to, the same way `@objectstack/spec` 17.7.0 reads it on the server (objectui#11439). That object is the action's declared `objectName`, else the object whose `actions` embed it.

- An action that belongs to an object reads `objects.OBJECT._actions.ACTION.*` only. Copy for it filed under `globalActions.ACTION` no longer applies: its label, confirm text, success message, outcome messages, description, parameters and result dialog show the authored text instead, as they already did everywhere the server translates. Move that copy to `objects.OBJECT._actions.ACTION`, which is where `os validate` asks for it.
- An action with no object (no `objectName`, not embedded in an object) still reads `globalActions.ACTION.*`.
- `useActionTextLocalizer` keys on the action's declared `objectName` before the object its caller passes, so an action declared on one object reads that object's copy wherever it is drawn.

`useObjectLabel()` and `useActionTextLocalizer()` keep their signatures; no input, export or translation key is added.
