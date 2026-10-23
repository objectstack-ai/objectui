---
'@object-ui/console': patch
---

A form field entry whose `label`, `placeholder` or `helpText` is an inline locale map (`{ en, 'zh-CN' }`) now renders in the visitor's language, on the public form `/f/:slug` and on the signed-in `/forms/:name` route (objectui#13380).

`@objectstack/spec` types all three keys as `I18nLabel`, so the map is valid metadata, but the form page passed it straight into text slots: a map on a label or help line blanked the page for every visitor (React error #31), and one on a placeholder read `[object Object]`. The map is now collapsed to the visitor's language when the form's rows are built, with the same resolver the console uses for an action's inline-map copy. A plain-string entry renders exactly as before.
