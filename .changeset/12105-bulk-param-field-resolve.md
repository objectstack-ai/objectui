---
'@object-ui/fields': minor
'@object-ui/plugin-grid': patch
'@object-ui/app-shell': patch
---

A bulk action's field-backed param now renders its real control on the selection bar, and the confirm step names the picked record (objectui#12105).

A list view's `bulkActions: ['add_to_campaign']` runs the object's own action over the selected records. When that action declares a field-backed param, `{ field: 'crm_campaign', objectOverride: 'crm_campaign_member' }`, the selection bar's dialog drew a plain text box for it, and the confirm step listed the raw record id. The record page drew the record picker for the same action, because only its dialog looked the field up.

- **One resolver for both dialogs.** The function that resolves an action param against the object's field definitions (`resolveActionParam` / `resolveActionParams`) moves, unchanged, from `@object-ui/app-shell` into `@object-ui/fields`, the one package both dialogs depend on. The record dialog and the bulk dialog both call it. A field-backed param on the selection bar now gets its field's type, label (translated), options, default and picker target, as it does on the record page. A lookup param renders the record picker, and the confirm step shows the record's label.
- **When it resolves.** The grid resolves a promoted action's params when the dialog opens, after it has loaded the session's object metadata, so a param whose owning object (`objectOverride`) has not loaded yet is waited for.
- **A missing field is refused, not drawn as a text box.** A field-backed param whose field is not in the object metadata is shown as a refusal naming `object.field`, and the run is blocked, as the record dialog already does. The copy is the existing `actionDialog.unresolvedParam` string.
- **Inline params are unchanged.** A param declared with its own `name` and `type` keeps the same widget, label, help text, default and `reference` target.

New `@object-ui/fields` exports: `resolveActionParam`, `resolveActionParams`, `resolveParamWidgetType`, `withKnownObjects`, `RESOLVED_ONLY_PARAM_KEYS`, and the types `RawActionParam`, `RawActionParamOption` and `ResolveActionParamsContext`. Before this change these were internal to `@object-ui/app-shell` and were not exported from it. No other export, prop, context member or language-pack key is added.

Not covered yet: on the selection bar, a resolved lookup param uses only its field's picker target, display field and `dependsOn`. The field's other picker settings (`lookupFilters`, `lookupColumns`, `descriptionField` and the rest) do not reach the bulk dialog yet.
