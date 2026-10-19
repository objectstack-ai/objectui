---
'@object-ui/plugin-form': minor
---

Publish `optionListDefault` (and its parameter type `OptionListFieldLike`) from the package entry: the reading of an option list's `default: true` that create forms seed from (objectui#11914). The console's public form page (`/f/:slug`) now seeds a field's option-list default through it, so a required select whose options mark a default opens on that option and submits it, instead of refusing the submit on the client (objectui#13049).
