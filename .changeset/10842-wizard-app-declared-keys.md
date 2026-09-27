---
'@object-ui/types': minor
'@object-ui/layout': patch
'@object-ui/plugin-designer': patch
---

The Studio's app wizard saves an app the platform accepts, and the app favicon has one
spelling, `branding.favicon` (objectui#10842).

**Creating an app is no longer refused.** The console's "create app" and "edit app" pages save through
`client.meta.saveItem('app', …)`, and the platform judges that document with
`@objectstack/spec`'s strict `AppSchema`. `wizardDraftToAppSchema` wrote four top-level keys the
spec does not declare (`type`, `title`, `favicon` and `layout`), so the save was refused with
`422 INVALID_METADATA` (`unrecognized_keys`). It now writes only declared keys: the draft's
title as `label`, the logo and favicon inside `branding`, and no `type` or `layout`. The spec
has no app layout, so the wizard's layout choice is not saved.

- `@object-ui/types` — **breaking:** `wizardDraftToAppSchema` now returns the app document
  (the spec's `App` shape, with objectui's `NavigationItem[]` as `navigation`) instead of an
  `AppComponentSchema` renderer node. It has no `type`, `title`, top-level `favicon` or `layout`.
  Code that read `result.title` reads `result.label`. Code that fed the result to
  `AppSchemaRenderer` builds the renderer node itself (`type: 'app'`, `title`).
- `@object-ui/types` — **breaking:** `AppComponentSchema.favicon` is now `never` on the
  TypeScript face, and the zod mirror refuses a top-level `favicon` by name, answering "Did you
  mean `favicon` → `branding`?". This is the objectui#10827 rule that retired the top-level
  `logo`: the spec refuses the key, and the console reads only `branding.favicon`.
- `@object-ui/layout`: `AppSchemaRenderer` puts `branding.favicon` on the tab. It read the
  top-level `favicon` before, and never `branding.favicon`.
- `@object-ui/plugin-designer`: `EditAppPage` keeps the keys the wizard does not maintain, but
  only keys the spec's `AppSchema` declares, read from that schema. A row stored before the
  schema closed is served with the old wizard's top-level keys, and echoing them made every
  edit of such an app fail the same way. Its pre-fill no longer falls back onto a top-level
  `logo`, `favicon` or `title`; it reads `branding.logo`, `branding.favicon` and `label`.

Migration: move a top-level `favicon` URL to `branding: { favicon: '…' }`.
