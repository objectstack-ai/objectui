---
'@object-ui/app-shell': patch
---

Derive the condition editor's subject vocabulary per metadata type at the generic
metadata-admin mount (objectui#9953).

`CONDITION_SCOPE_BY_METADATA_TYPE` rules `action`, `hook` and `validation` all
`'record'`, and each verdict is right — every one of those evaluators binds the row
as the `record` root. But that table answers how a predicate is **linted**, not what
its host **binds**, and on the second question the three disagree: a hook's
`condition` and a validation rule's guard are evaluated on the server against
`record` and `previous` alone, while an action's `visible` is evaluated in the
browser, where `user` is bound.

The generic `ConditionWidget` mount is polymorphic over all of them, so it took the
default subject vocabulary — `record.id` plus `user.id` / `user.email` / `user.role`
/ `user.isAdmin` — for every type. Measured: a hook has a registered default
inspector but **no** registered preview, so `ResourceEditPage` renders its plain
whole-draft form and the curated `HookDefaultInspector` (which hides `condition` from
its own fallback) never runs. An author editing a hook could therefore pick
`user.isAdmin` from the dropdown, watch it lint clean at record scope, and have the
hook wrapper throw on every write the condition was supposed to gate.

`conditionSubjectsForMetadataType` — the sibling of `conditionScopeForMetadataType`
— now derives that vocabulary from the type on screen, backed by a table of which
host evaluates each type's condition. Server-evaluated types get the narrowed list
the two curated inspectors already declare; the client-evaluated tier keeps the
default, because `user` really is bound there and narrowing it would take a working
subject away. A type with no measured host declares nothing and is unchanged.
