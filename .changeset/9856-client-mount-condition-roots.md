---
'@object-ui/app-shell': minor
---

Client-evaluated `ConditionBuilder` mounts declare the scope roots their own host binds
(objectui#9856) — the declared cost of objectui#9645, now paid.

objectui#9645 made a `scope="record"` mount advertise `RECORD_CONDITION_ROOTS` rather
than the CEL engine's whole default list, and named this follow-up on its own face: the
narrowed set is the one EVERY host of a record-scoped condition binds, which is right
for a mount whose host the component cannot see and wrong for a mount whose host binds
more. An action's `visible` / `disabled` is evaluated in the BROWSER, where the shell's
own expression scope publishes the identity roots and the deployment feature flags, so
those mounts had been advertising two roots while their evaluator answered six — with
the inspector's own section hint still promising predicates "over the record / user /
ctx".

**What changes for an author.** Editing an action's **Visible when** / **Disabled when**
— through the curated inspector or through the generic metadata form — the raw CEL
editor again suggests `user`, `current_user`, `os`, `ctx` and `features`, and its worked
example teaches the `user` clause again. Nothing an author could already type stops
working anywhere: the accept set is untouched, so this moves SUGGESTIONS only.

**One root is withdrawn at those same mounts, deliberately.** `previous` is no longer
offered where a browser evaluates the predicate. No client host binds it — the row
arrives alone and the ambient scope publishes no `previous` — so suggesting it there
built a predicate that could only fault. Server-evaluated mounts (a hook `condition`, an
object validation rule's guard) keep it and keep their narrowing exactly as
objectui#9645 left it.

**Which tier evaluates which metadata type is not re-decided here.** It is read from
`CONDITION_HOST_BY_METADATA_TYPE` (objectui#9953), the ruled table, through a new
`conditionRootsForMetadataType` — the third derivation off it, beside the lint scope and
the subject vocabulary. Mounts whose tier that table does not measure (a page block's
`visibleWhen`, a flow node's entry condition) declare nothing and are unchanged byte for
byte.

The advertised list is never retyped: its pin rebuilds it from the two producers that
decide it and lints every member at the `record` scope, so it reddens both when a host
binding moves and when a root is advertised that the engine would refuse.
