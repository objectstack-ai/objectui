---
'@object-ui/components': patch
---

A boolean field whose `defaultValue` is a CEL expression or a runtime token now gets that default on create (objectui#12121).

The form renderer starts an unsupplied switch or checkbox at `false`, so an untouched one submits a value. On a create form that also happened to a boolean the server fills, such as `defaultValue: { dialect: 'cel', source: 'true' }`. The create payload carried `false`, and the server, which applies a declared default only to a field that arrives empty, stored `false` instead of evaluating the declaration.

The renderer no longer starts such a field at `false`. An untouched one is left out of the create payload, so the server applies the declared default, and it shows "Set automatically when saved." under the control, as every other field the server fills does. A `required` boolean with such a default is not refused as empty. A value the user sets, `false` included, is submitted as usual.

Unchanged: a boolean with no runtime default still starts at `false` and submits `false` when untouched, and an edit form still starts an unsupplied boolean at `false`.
