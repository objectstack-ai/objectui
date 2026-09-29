---
'@object-ui/app-shell': patch
---

feat(app-shell): Studio's app, permission and view previews show the authored area descriptions, RLS policy labels and view label

Four display keys that `@objectstack/spec` parses and publishes reached no human anywhere in Studio. The designer previews now render each one where it was authored:

- **`app.areas[].description`** — the app preview lists the app's navigation areas: each area's `label` and `id`, with its `description` beneath it. Both `label` and `description` are the spec's `I18nLabel`, so a per-locale map resolves in the designer locale through the spec's own `resolveI18nLabel` rather than printing `[object Object]`.
- **`permission.rowLevelSecurity[].label`** and **`permission.rowLevelSecurity[].description`** — the permission preview lists each row-level security policy by its `name`, with its `label` beside it and its `description` beneath it, under the existing "Row-Level Security" heading. The header pill still counts them. A permission set whose only grants are policies now shows those policies instead of the "grant at least one permission" empty state.
- **the `view` container `label`** — the view preview draws the view's own `label` as its heading, on the list route, the form route and the no-object state alike. Before, the label was relayed only into the one named list view the preview injects, and `object-view` draws its named-view tab strip for two or more entries, so it never reached the screen. The fix is a heading, not a one-entry tab strip.

A key the author did not write renders nothing: no invented stand-in text. The one new piece of chrome, the areas heading (`engine.appPreview.areas`), is a designer table row in `en` and `zh` like its siblings; the policy list reuses the existing `perm.rls.title` row.
