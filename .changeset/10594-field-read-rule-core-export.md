---
'@object-ui/core': minor
'@object-ui/fields': patch
'@object-ui/react': patch
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

`@object-ui/core` exports `withoutDeniedFields(record, policy, objectName, extraKeep?)`, the field-read rule for one record: the record as the viewer may read it on `objectName` (objectui#10594).

Every field the loaded `policy` denies is removed, which leaves the row ObjectStack's `FieldMasker` already serves. `id`, `_id` and any key in `extraKeep` (a declared id field) are never judged. Before a policy loads, with no policy, with no object name, or for a value that is not an object, the record comes back as it is; when nothing is withheld the SAME object comes back. `policy` is structural (`isLoaded` and `checkField`), so `usePermissions()` from `@object-ui/permissions` satisfies it and `@object-ui/core` gains no dependency.

The renderer's display surfaces that each carried a module-private copy of this rule now call the export, with no change in what they draw:

- `@object-ui/fields`: the lookup cell's name and the user cell's name and avatar (the package entry), and the lookup editor's option label and search chip avatar (`LookupField`).
- `@object-ui/react`: `useRecordSearch`'s hit label under `fieldReadPolicy`.
- `@object-ui/app-shell`: the record page's title and the row its blocks read (`RecordDetailView`).
- `@object-ui/plugin-detail`: `DetailView`'s header title and `record:details`' title dedupe. The package-internal `withoutDeniedFields` module is removed; it was never a package export.
