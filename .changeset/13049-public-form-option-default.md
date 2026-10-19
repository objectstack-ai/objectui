---
'@object-ui/plugin-form': minor
'@object-ui/console': patch
---

Publish `optionListDefault` (and its parameter type `OptionListFieldLike`) from the package entry: the reading of an option list's `default: true` that create forms seed from (objectui#11914). The console's public form page (`/f/:slug`) now seeds a field's option-list default through it, so a required select whose options mark a default opens on that option and submits it, instead of refusing the submit on the client (objectui#13049).

Console: on a public form, a select whose options mark `default: true` (and that declares no `defaultValue`) now opens with that option selected, so an untouched submit sends it instead of failing with "Required: FIELD".
