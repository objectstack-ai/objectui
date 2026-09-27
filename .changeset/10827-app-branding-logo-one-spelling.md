---
'@object-ui/types': minor
'@object-ui/layout': patch
'@object-ui/app-shell': patch
'@object-ui/runner': patch
---

An app's `branding.logo` now shows in the console, and it is the only logo spelling
(objectui#10827).

**The console renders it.** The designer (`AppCreationWizard`, `BrandingEditor`) writes an
app's `branding.logo` and previews it, but nothing mounted in the console drew it. Its only
reader was `AppSidebar`, which was never mounted and has since been removed. `UnifiedSidebar`,
the console's sidebar, now reads the active app's `branding.logo` and shows it as an image in a
header at the top of the sidebar. The image's alt text is the app's label. An app without a
logo gets no header, so its sidebar looks the same as before. The header appears only inside
an app. On Home the sidebar's fallback app is not the screen's app, so no logo is shown there.
`AppShellBranding` is unchanged: objectui#4818 removed its `logo` key, and this change does not
add it back.

**One spelling — breaking for a top-level `logo`.** `@objectstack/spec` declares the app logo
only as `branding.logo` (a URL). Its app schema refuses a top-level `logo` and suggests
`branding`. objectui had a second spelling of its own: `AppComponentSchema.logo`, described as
"Logo URL or icon name". This change retires it:

- `@object-ui/types`: `AppComponentSchema.logo` is now `never` on the TypeScript face, and the
  zod mirror refuses a top-level `logo` by name, answering "Did you mean `logo` → `branding`?".
  It is a named refusal rather than a deletion because the node is `.passthrough()`, and a
  deleted key would be kept without any error. `wizardDraftToAppSchema` no longer copies the
  draft's logo to the top level. The logo goes into `branding` only.
- `@object-ui/layout`: `AppSchemaRenderer`'s default sidebar header draws `branding.logo` as
  an image. This includes site-relative paths and `data:` URIs, which the old read skipped
  because it drew an image only for values starting with `http`. The header's icon now comes
  from the app's `icon`.
- `@object-ui/runner`: `LayoutRenderer`'s sidebar brand mark does the same. It draws
  `branding.logo` as an image and takes an icon name from `icon`. It no longer guesses the kind
  of value from a `/` or `.`.

Migration: move a top-level `logo` URL to `branding: { logo: '…' }`. An icon name that was
written as `logo` belongs in `icon`. The published 17.6.0 changelog entry that removed
`AppShellBranding.logo` says the top-level `logo` is "rendered directly by
`AppSchemaRenderer`'s default sidebar header". That is no longer true: the header reads
`branding.logo`.
