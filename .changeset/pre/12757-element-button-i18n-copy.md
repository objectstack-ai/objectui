---
'@object-ui/components': patch
---

A page's `element:button` shows its inline action's copy in the user's language (objectui#12757). The spec types an inline action's `label`, `confirmText`, `successMessage` and `errorMessage` as `I18nLabel`: a string or a per-locale map keyed by language tag (`en`, `zh-CN`, …). The button handed a map to the action runner as is, and the runner, which has no language, skipped it: the success toast read the generic "completed successfully" copy, the error toast read the generic failure copy, and the confirm prompt and the param dialog's title received an object instead of text.

The button now resolves its action through `useActionTextLocalizer`, the localizer every other action surface already uses, before it runs it. A map reads the entry for the user's language, and a translation-bundle entry for a named action still wins over the authored copy. Copy written as a plain string reaches the runner unchanged.

Clause-②: no. No prop, export or i18n key is added or removed; the button's props and the package entry are unchanged.
