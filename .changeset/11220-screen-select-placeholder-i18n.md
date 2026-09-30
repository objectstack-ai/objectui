---
'@object-ui/app-shell': patch
---

fix(app-shell): a flow screen select with no placeholder shows the locale's own "Select…" word (objectui#11220)

A screen field of select shape (it carries `options`) that declares no `placeholder` fell
back to a hard-coded English `'Select…'` in `ScreenFieldInput`, so the runtime flow dialog
(`FlowRunner`) and Studio's flow screen preview — both render through `ScreenView` — showed
that English word under every locale, beside otherwise localized copy.

The fallback now reads the shared `common.select` key through `useObjectTranslation()`,
the same word the object form's lookup picker already shows in that spot, so a zh user
sees the zh pack's word and every other built-in locale its own translation. A host that mounts
`ScreenView` without an `I18nProvider` still sees `Select…`, never the raw key.

An authored placeholder renders verbatim, as before. One behaviour changes on purpose:
an authored `placeholder: ''` used to be replaced by `Select…` (the fallback was `||`);
it now renders as authored, empty (`??`).
