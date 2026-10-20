---
'@object-ui/console': patch
'@object-ui/i18n': patch
---

Settings pages: when the server refuses a save field by field, the toast now names the refused settings by the labels their rows show, for example "1 setting needs attention: Default timezone" (objectui#13146). It used to repeat the server's log sentence, which named the namespace and each machine key, called every refusal "incomplete" even for a malformed value, and repeated each row's whole message, help text included. Each row still shows its own reason. A refusal that names no setting on the page toasts "Save failed", and a refusal with no field errors still shows the server's message.

The sentence is the new `console.settingsView.fieldErrorsToast` plural family, in all ten packs. The labels are joined with each pack's `validation.formInvalidJoiner`.
