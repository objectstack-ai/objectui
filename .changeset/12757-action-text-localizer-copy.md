---
'@object-ui/react': patch
---

`useActionTextLocalizer` resolves every `I18nLabel` copy an action declares (objectui#12757). It used to collapse a per-locale map only for `label` and `successMessage`, and only when the action had a `name`. A `confirmText` or `errorMessage` map, or any map on a nameless action, such as an inline `element:button` action, reached the action runner as an object, so the confirm prompt received an object and the toasts fell back to the runner's generic copy.

The localizer now collapses `label`, `confirmText`, `successMessage` and `errorMessage` to the active language on every action, named or not. A translation-bundle entry for a named action still wins over the collapsed copy. `errorMessage` has no bundle key, so the collapse is all it gets. An action whose copy is already plain text comes back unchanged.

Clause-②: no. The hook's signature and the package entry are unchanged; no export, prop or i18n key is added or removed.
