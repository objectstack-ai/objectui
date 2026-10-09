---
'@object-ui/i18n': minor
'@object-ui/app-shell': patch
---

The approval decision panel draws a short notice instead of nothing when it is placed anywhere other than an approval request's record page (objectui#12072).

- **`@object-ui/app-shell`.** Off a `sys_approval_request` record page, that is on another object's record page or on a page with no record at all, the decision panel (the renderer proposed as `record:approval_decision`, still module-internal) now draws a muted notice saying it works only on approval request pages. A misplaced block is therefore visible to its author instead of silently empty. On a request page whose record has not loaded yet it still draws nothing, and on a request page with its record it draws the panel as before. This replaces the clause of objectui#12045's entry that says the panel renders nothing outside a request page.
- **`@object-ui/i18n`.** One new language-pack key for that notice, `approvalsInbox.decisionPanelOffRequestPage`, in all ten packs.

**Clause-②: yes (widening).** The published language packs gain one key, `approvalsInbox.decisionPanelOffRequestPage`, so the exported `en` pack and the `TranslationKeys` type read off it gain that one member. No export or prop is added or removed, and no existing key changes.
