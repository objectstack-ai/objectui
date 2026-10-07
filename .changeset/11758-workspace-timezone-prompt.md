---
'@object-ui/console': minor
'@object-ui/i18n': minor
---

The console asks an administrator once to set the workspace timezone while it is still the platform default, pre-filled with the browser's zone (objectui#11758, the gate the objectui#11693 ruling put on rendering instants in the workspace's zone).

- **When it asks.** On opening an app, when `localization.timezone` resolves from the manifest default (no env, global or tenant value, and not locked), the session holds the localization manifest's `writePermission`, and the browser reports a zone the settings door admits: the manifest's declared `iana_time_zone` domain, judged by `isValueDomainMember` from `@objectstack/spec/shared`. A session that may not write settings is never asked, and reads nothing beyond the settings list.
- **Once.** The prompt is recorded as shown, on this device, per administrator and per workspace, at the moment it opens. It does not ask again there, whatever the answer.
- **Confirm** writes `localization.timezone` with the chosen zone through the Settings page's own save (`PUT /api/settings/localization`), so the same permission check and audit apply, and a refused zone shows in the field as it does on the Settings page. **Decline**, or closing the dialog, writes nothing.
- The zone is edited in the Settings page's own timezone field: any IANA zone can be typed, with the curated zones as suggestions.

New language-pack keys in `@object-ui/i18n`, in all ten packs: `console.workspaceTimezonePrompt.title`, `.description` (interpolates `{{current}}`), `.laterHint`, `.decline`, `.confirm` and `.saved` (interpolates `{{zone}}`). No export, prop or type member is added.
