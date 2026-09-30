---
'@object-ui/types': minor
---

**`@object-ui/types/zod` now accepts a `combobox` without `options` and a `command` without `groups`** (objectui#6033, rulings C7 / C8)

The zod mirror required both keys. The TypeScript declarations already had them
as optional (`ComboboxSchema.options?`, `CommandSchema.groups?`), and the
registered renderers already handled a missing key: `combobox` draws an empty
option list and `command` draws its search input and empty text. So
`{ "type": "combobox" }` type-checked and rendered, but `safeValidateSchema`
refused it. The mirror now marks both keys `.optional()`, so the declaration,
the validator and the renderer agree.

This only widens what the validator accepts. Everything that parsed before still
parses. A wrong-typed value (`options: "x"`) and a malformed element (an option
with no `value`) are still refused, on the same path as before. No runtime code
changed.
